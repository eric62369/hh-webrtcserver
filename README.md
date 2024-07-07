Useful commands
- in nakama/ directory, 
    - docker compose up
        - starts up the nakama server
        - Take your built docker image, and spin up as many container instances as you want
    - docker build .
        - image needs updating based on the Dockerfile
    - docker build . && docker compose up
    - docker exec -t -i nakama-nakama-1 /bin/bash
        - bash window for docker
    - docker ps -a
        - ls for docker containers

- http://127.0.0.1:7351 - "Nakama console" UI
- 127.0.0.1:7351
    - put this into a web browser to see the UI, the login is NOT the default creds
- in nakama/ directory, npx tsc
    - typescript code compile

Need a rundown on setting up node.js runtime environment on the server? https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/#with-docker

Nakama Console:
- API Explorer:
    - This stores RPC API endpoints we can call. Use a User-ID from the "Accounts" Tab
    - Your custom RPC endpoints should be at the top of the dropdown list

What's next?
- start on custom match handler for lobbies

- Something's wrong with the g-diffuser:
    - js_entrypoint in the .yml configs for nakama setup stuff is quite important. Can't find InitModule without knowing where the main JS file is
    - That being said, our docker-compose.yml + Dockerfile setup from snopek is different than the recommended nakama docs
    - We'll have to understand more about how the docker setup currently works. Setting volumes in nakama based on local data/ folder could be messing things up?


prod server
- http(s)://IP/7351 - nakama console
- sudo docker compose up in ../app/nakama directory

prod server needs a backup? (this will take down the server)
sudo docker-compose pull
sudo docker-compose stop
sudo docker-compose up -d