# LUActor
simple lua protector for basic security

# Features
- ### Anti-decompiler
  Breaks decompiler, so you don't have to care that somebody decryptins your script
  
- ### String encryption
  Your strings will be safe, without performance impact (upd: now im not sure about it).
  
- ### Object indexing hider
  When you do `object.index` (`io.read` for ex.) the protector hides it.

- ### Global variables protection
  Nobody is gonna see your globals :)
  
# Run
 `node .\main.js .\input.lua .\build.lua`

# Screenshots
![image](https://user-images.githubusercontent.com/46263989/193435175-d4fc5814-6214-44b8-bbb5-653ed9a6db56.png)
