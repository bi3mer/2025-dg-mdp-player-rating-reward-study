import subprocess

data = ""

with open("questions.txt", "r") as f:
    for i, line in enumerate(f.readlines()):
        data += "<tr>\n"
        data += f"<td>{line.strip()}</td>\n"
        data += f'<td><input type="radio" name="{i}">Not at all</td>\n'
        data += f'<td><input type="radio" name="{i}">Slightly</td>\n'
        data += f'<td><input type="radio" name="{i}">Moderately</td>\n'
        data += f'<td><input type="radio" name="{i}">Fairly</td>\n'
        data += f'<td><input type="radio" name="{i}">Extremely</td>\n'
        data += "<tr>\n"


subprocess.run("pbcopy", text=True, input=data)
print("html copied to your clipboard :D")
