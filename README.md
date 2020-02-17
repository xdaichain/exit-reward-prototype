# Running EXIT token prototype App with Docker Compose

To run the [Application](https://github.com/xdaichain/exit-reward-prototype/tree/master/app), follow these steps:

1. Download `docker-compose.yml`:

    ```bash
    $ git clone -b docker-compose https://github.com/xdaichain/exit-reward-prototype
    $ cd exit-reward-prototype
    ```

2. Write a private key of autorebalancer address to the root `key` file (don't forget to make sure this address has a non-zero balance to be able to make `rebalance` transactions).

3. Edit `docker-compose.yml`: set `VIRTUAL_HOST` and `LETSENCRYPT_HOST` environment variables to an actual domain name and change `RATIO_READ_INTERVAL`, `REBALANCE_INTERVAL`, `REBALANCER_MAX_GAS_PRICE` if needed.

4. Start:

    ```bash
    $ docker-compose up -d
    ```

This will automatically up and run the App on the specified domain with `https`. Docker Compose will
- download the required images from Docker Hub: [exit-prototype-ui](https://hub.docker.com/r/poanetwork/exit-prototype-ui), [nginx](https://hub.docker.com/_/nginx/), [docker-gen](https://hub.docker.com/r/xdaichain/docker-gen), [letsencrypt-nginx-proxy-companion](https://hub.docker.com/r/jrcs/letsencrypt-nginx-proxy-companion);
- create containers from them;
- start up the containers.
  - `letsencrypt-nginx-proxy-companion` inspects containers' metadata and tries to acquire certificates as needed (if successful then saving them in a volume shared with the host and the Nginx container).
  - `docker-gen` also inspects containers' metadata and generates the configuration file for the main Nginx reverse proxy.
  
## Troubleshooting

- To view logs run `docker-compose logs`.
- To view the generated Nginx configuration run `docker exec -ti nginx cat /etc/nginx/conf.d/default.conf`.

## How it works

The system consists of 4 main parts:

- Main Nginx reverse proxy container.
- Container that generates the main Nginx config based on container metadata.
- Container that automatically handles the acquisition and renewal of Let's Encrypt TLS certificates.
- The actual Application living in its own container.
