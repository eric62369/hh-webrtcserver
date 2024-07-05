Useful commands
- in nakama/ directory, docker compose up
    - starts up the nakama server
- http://127.0.0.1:7351 - "Nakama console" UI
- 127.0.0.1:7351
    - put this into a web browser to see the UI, the login is NOT the default creds

Need a rundown on setting up node.js runtime environment on the server? https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/#with-docker

Nakama Console:
- API Explorer:
    - This stores RPC API endpoints we can call. Use a User-ID from the "Accounts" Tab
    - Your custom RPC endpoints should be at the top of the dropdown list

What's next?
- set up local nakama - DONE yay!
- start on custom match handler for lobbies

prod server
- http(s)://IP/7351 - nakama console
- sudo docker compose up in ../app/nakama directory