﻿# Distributed Systems WS 24
 
 To start the whole application just execute the docker-compose.yaml file with "docker-compose up".
 The backend is with Node.js and the database is with postgreSQL. The frontend is from an docker image and will be pulled in the docker-compose file.
 
##Kubernetes

    kubectl apply -f postgres-deployment.yaml
    kubectl apply -f shoppingdb-service.yaml
    kubectl apply -f backendjs-deployment.yaml
    kubectl apply -f backendjs-service.yaml
