from django.core.management.base import BaseCommand
import subprocess
import os
import time
import threading
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Run the Django development server along with a watcher for .svelte files.'

    def handle(self, *args, **options):
        event = threading.Event()
        ready_event = threading.Event()
        stop_event = threading.Event()

        # Create two threads: One for Django server and another for Svelte watcher
        django_thread = threading.Thread(target=start_django_server, args=(ready_event,))
        svelte_thread = threading.Thread(target=watch_svelte_files, args=(event, stop_event))
        
        django_thread.start()
        while not ready_event.is_set(): # Wait for the initial build to finish
            time.sleep(1)
        svelte_thread.start() # Start the Svelte watcher

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
            stop_event.set()
            django_thread.join()
            svelte_thread.join()
            print("Server shut down gracefully.")


def start_django_server(ready_event):
    try:
        # Start the server immediately for the first time
        subprocess.check_call(['npm', 'run', 'build']) # Build the Svelte app
        ready_event.set() # Signal that the initial build is done
        subprocess.call(['python', 'manage.py', 'runserver'], bufsize=1) # Start the Django server

    except subprocess.CalledProcessError as e:
        print("Error during initial build:")
        print(e)
    

def watch_svelte_files(event_flag, stop_event):
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler

        class SvelteFileHandler(FileSystemEventHandler):
            last_triggered_time = None
            debounce_delay = timedelta(milliseconds=10000) # <-- Change this value to adjust the debounce delay if 
                                                            # it's too slow or too fast and double-triggers build command

            def on_modified(self, event):
                if event.is_directory:
                    return

                current_time = datetime.now()
                if self.last_triggered_time and current_time - self.last_triggered_time < self.debounce_delay:
                    return

                file_extension = ('.svelte', '.js', '.ts', '.css') # Add more extensions if needed
                if event.src_path.endswith(file_extension):
                    print(f"{event.src_path} changed, recompiling...")
                    subprocess.call(['npm', 'run', 'build'])
                    subprocess.call(['touch', 'manage.py'])
                    event_flag.set()
                    self.last_triggered_time = current_time

        path = os.getcwd() # Watch the current directory
        event_handler = SvelteFileHandler()
        observer = Observer()
        observer.schedule(event_handler, path, recursive=True)
        observer.start()

        while not stop_event.is_set():
            time.sleep(1)

        observer.stop()
        observer.join()

    except ImportError:
        print("Please install the 'watchdog' package to watch for .svelte file changes.")
        print("You can install it with 'pip install watchdog'.")
