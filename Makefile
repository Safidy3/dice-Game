USERNAME=safandri
DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml

all: up

setup:
	mkdir -p /home/$(USERNAME)/data/mariadb
	mkdir -p /home/$(USERNAME)/data/wordpress

rmDB:
	sudo rm -rf /home/$(USERNAME)/data

up:
	docker compose -f $(DOCKER_COMPOSE_FILE) up -d --build

stop:
	docker compose -f $(DOCKER_COMPOSE_FILE) stop

down:
	docker compose -f $(DOCKER_COMPOSE_FILE) down
	make rmDB

re: down up

clean: down
	docker system prune -af --volumes
	make rmDB

cleanRe: clean up

execMariadb:
	docker exec -it mariadb bash

execWP:
	docker exec -it wordpress bash

execNginx:
	docker exec -it nginx bash

checkTSL:
	openssl s_client -connect safandri.42.fr:443 -tls1_2

checkNetwork:
	docker network inspect srcs_inception

.PHONY: all setup rmDB up stop down re clean prune cleanRe execMariadb execWP execNginx