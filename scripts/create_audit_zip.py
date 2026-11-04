import os
import zipfile
import sys

def create_audit_zip():
    project_dir = r"c:\Users\dasar\OneDrive\Documents\New folder\smartwill-india"
    zip_dest = r"c:\Users\dasar\OneDrive\Documents\New folder\smartwill-india-rev13.zip"

    if os.path.exists(zip_dest):
        try:
            os.remove(zip_dest)
            print(f"Removed previous zip: {zip_dest}")
        except Exception as e:
            print(f"Warning: could not remove existing zip: {e}")

    excluded_dirs = {
        'node_modules',
        '.git',
        '.system_generated',
        '.vscode',
        '.idea',
        '__pycache__'
    }

    excluded_extensions = {
        '.zip',
        '.tar',
        '.gz',
        '.log'
    }

    total_files = 0
    total_uncompressed_bytes = 0

    print(f"Creating audit zip archive: {zip_dest}")
    with zipfile.ZipFile(zip_dest, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in excluded_dirs]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in excluded_extensions and file != 'package.json':
                    continue
                if file.startswith('.env'):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_dir)
                
                zf.write(full_path, rel_path)
                total_files += 1
                total_uncompressed_bytes += os.path.getsize(full_path)

    zip_size_bytes = os.path.getsize(zip_dest)
    zip_size_mb = zip_size_bytes / (1024 * 1024)

    print("\n--- ZIP CREATION SUCCESSFUL ---")
    print(f"Destination: {zip_dest}")
    print(f"Total files archived: {total_files}")
    print(f"Uncompressed size: {total_uncompressed_bytes / (1024 * 1024):.2f} MB")
    print(f"Compressed archive size: {zip_size_mb:.2f} MB ({zip_size_bytes} bytes)")

if __name__ == '__main__':
    create_audit_zip()
