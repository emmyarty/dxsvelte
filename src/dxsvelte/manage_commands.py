import sys
import subprocess
import os

def run_command():
    command = sys.argv[0].split('/')[-1]  # Extracts the command name
    args = sys.argv[1:]

    # Determine the manage.py path, adjust accordingly
    manage_path = os.path.join(os.getcwd(), 'manage.py')

    if command == "run":
        subprocess.call(['python', manage_path, 'rundx'] + args)
    elif command == "mkm":
        subprocess.call(['python', manage_path, 'makemigrations'] + args)
    elif command == "migrate":
        subprocess.call(['python', manage_path, 'migrate'] + args)
    else:
        print(f"Unknown command: {command}")

if __name__ == '__main__':
    run_command()