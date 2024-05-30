import json
import os

if os.path.isdir("levels"):
    for filename in os.listdir("levels"):
        os.remove(os.path.join("levels", filename))
else:
    os.mkdir("levels")

with open("levels.json", "r") as f:
    levels = json.load(f)

corpus_data = []
info_data = {"fitness": {}}
for id in levels:
    with open(os.path.join("levels", f"{id}_0.txt"), "w") as f:
        # remove first and last 2 characters from levels which includes players
        f.write("\n".join(r[2:-2] for r in levels[id]))

        leniency, density = id.split("_")
        corpus_data.append(f"{id},{density},{leniency},0,0")
        info_data["fitness"][f"{id}_0.txt"] = 0

with open("config_map_elites_generate_corpus_data.csv", "w") as f:
    f.write("Density,leniency,index,performance\n")
    f.write("\n".join(corpus_data))

with open("generate_corpus_info.json", "w") as f:
    json.dump(info_data, f, indent=1)
