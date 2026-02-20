import re
import os

# Name deiner Datei
input_file = "wms-prototype-v1.1-incoming-optimized (6) (1).html"

def split_wms_project(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. CSS extrahieren
    css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if css_match:
        with open('styles.css', 'w', encoding='utf-8') as f:
            f.write(css_match.group(1).strip())
        print("✅ styles.css erstellt")

    # 2. JS extrahieren
    js_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
    if js_match:
        js_content = js_match.group(1).strip()
        
        # Wir splitten das JS in Daten und Logik
        # Suche nach dem Ende der Helfer-Funktionen / Anfang der App
        app_split = js_content.find('function App()')
        
        with open('constants.js', 'w', encoding='utf-8') as f:
            f.write(js_content[:app_split].strip())
        print("✅ constants.js (Daten & Helfer) erstellt")
        
        with open('app_logic.js', 'w', encoding='utf-8') as f:
            f.write(js_content[app_split:].strip())
        print("✅ app_logic.js (React Komponenten) erstellt")

    # 3. HTML Gerüst (index.html)
    # Entferne den riesigen CSS und JS Block und verlinke die neuen Dateien
    html_shell = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="styles.css">', content, flags=re.DOTALL)
    html_shell = re.sub(r'<script type="text/babel">.*?</script>', 
                        '<script type="text/babel" src="constants.js"></script>\n  <script type="text/babel" src="app_logic.js"></script>', 
                        html_shell, flags=re.DOTALL)
    
    with open('index_optimized.html', 'w', encoding='utf-8') as f:
        f.write(html_shell.strip())
    print("✅ index_optimized.html erstellt")

if __name__ == "__main__":
    split_wms_project(input_file)