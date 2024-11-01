Useful commands
- in nakama/ directory, 
    - docker compose up
        - starts up the nakama server
        - Take your built docker image, and spin up as many container instances as you want
    - docker build .
        - image needs updating based on the Dockerfile
    - npx tsc && docker build . && docker compose up
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
- Connect server authoritative lobbies with client code
- Make any changes necessary

prod server
- http(s)://IP/7351 - nakama console
- sudo docker compose up in ../app/nakama directory

prod server needs a backup? (this will take down the server)
sudo docker-compose pull
sudo docker-compose stop
sudo docker-compose up -d