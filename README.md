# Running EXIT token prototype with Docker Compose

1. Write a private key of autorebalancer address to the root `key` file (don't forget to make sure this address has a non-zero balance to be able to make `rebalance` transactions).

2. Edit docker-compose.yml: set `VIRTUAL_HOST` and `LETSENCRYPT_HOST` environment variables to an actual domain name and change `RATIO_READ_INTERVAL`, `REBALANCE_INTERVAL`, `REBALANCER_MAX_GAS_PRICE` is needed.

3. Perform the following commands:

    ```bash
    $ git clone -b docker-compose https://github.com/xdaichain/exit-reward-prototype
    $ cd exit-reward-prototype && docker-compose up -d
    ```

This will automatically up and run the App on the specified domain with `https`.
