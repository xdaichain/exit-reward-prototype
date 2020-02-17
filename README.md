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

This will automatically up and run the App on the specified domain with `https`.
