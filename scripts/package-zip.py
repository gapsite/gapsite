import os
import sys
import zipfile

def create_deployment_archive(output_zip_path, files_and_dirs):
    """
    Creates a zip archive with items placed directly at the root of the archive,
    without any enclosing wrapper folder.
    """
    base_dir = os.path.abspath(os.path.dirname(__file__) + '/..')
    output_path = os.path.join(base_dir, output_zip_path)
    
    print(f"[package-zip] Creating deployment archive: {output_path}")
    
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        for item in files_and_dirs:
            full_path = os.path.join(base_dir, item)
            if not os.path.exists(full_path):
                print(f"[package-zip] Warning: '{item}' not found, skipping.")
                continue
                
            if os.path.isfile(full_path):
                # Write file directly at archive root
                arcname = os.path.basename(item)
                zip_file.write(full_path, arcname)
                print(f"  + Added file: {arcname}")
            elif os.path.isdir(full_path):
                # Write directory contents preserving relative path under the directory name
                for root, dirs, files in os.walk(full_path):
                    for file in files:
                        file_full = os.path.join(root, file)
                        rel_path = os.path.relpath(file_full, base_dir)
                        zip_file.write(file_full, rel_path)
                print(f"  + Added directory tree: {item}/")
                
    print(f"[package-zip] Successfully created {output_zip_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    items = [
        'server.js',
        'package.json',
        'package-lock.json',
        'dist',
        'data',
        '.htaccess',
    ]
    # Create deploy.zip and gaphorizon-deploy.zip
    create_deployment_archive('deploy.zip', items)
    create_deployment_archive('gaphorizon-deploy.zip', items)
