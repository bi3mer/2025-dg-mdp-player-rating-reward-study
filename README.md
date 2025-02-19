# 2024_aiide_demdp

TODO:

- need something to log for the tutorial the tutorial
- can you make a label element for -1 and then click that and that affects the radio button.


### Getting the Data

```bash
npx -p node-firestore-import-export firestore-export -a ../keys/crowdgames-rq22-firestore-key.json -b backup.json
```

This command only works for me. If you want to use this, you need to generate a private key with the following:

- Go to Firebase console
- Select the project
- Go to *project settings* (it's the gear icon at the top left)
- Go to *service accounts*
- Press *generate new private key*

Then, you should place the private key somewhere and update the path in the command above.