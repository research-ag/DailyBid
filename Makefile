deploy:
	dfx canister --ic create --all
	dfx deploy --ic assets
	dfx deploy --ic ic_siwe_provider --argument "( \
	    record { \
	        uri = \"https://daily-bid.com\"; \
	        runtime_features = null; \
	        domain = \"daily-bid.com\"; \
	        statement = opt \"Login to the DailyBid app\"; \
	        scheme = opt \"http\"; \
	        salt = \"randomsalt123\"; \
	        session_expires_in = opt (604_800_000_000_000 : nat64); \
	        targets = null; \
	        chain_id = null; \
	        sign_in_expires_in = opt (300_000_000_000 : nat64); \
	    } \
	)"

deploy-local:
	dfx canister create --all
	dfx deploy assets
	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        uri = \"http://localhost:3000\"; \
	        runtime_features = null; \
	        domain = \"localhost\"; \
	        statement = opt \"Login to the DailyBid app\"; \
	        scheme = opt \"http\"; \
	        salt = \"randomsalt123\"; \
	        session_expires_in = opt (604_800_000_000_000 : nat64); \
	        targets = null; \
	        chain_id = null; \
	        sign_in_expires_in = opt (300_000_000_000 : nat64); \
	    } \
	)"

deploy-siwe:
	dfx canister --ic create ic_siwe_provider
	dfx deploy --ic ic_siwe_provider --argument "( \
	    record { \
	        uri = \"https://daily-bid.com\"; \
	        runtime_features = null; \
	        domain = \"daily-bid.com\"; \
	        statement = opt \"Login to the DailyBid app\"; \
	        scheme = opt \"http\"; \
	        salt = \"randomsalt123\"; \
	        session_expires_in = opt (604_800_000_000_000 : nat64); \
	        targets = null; \
	        chain_id = null; \
	        sign_in_expires_in = opt (300_000_000_000 : nat64); \
	    } \
	)"	

deploy-siwe-local:
	dfx canister create ic_siwe_provider
	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        uri = \"http://localhost:3000\"; \
	        runtime_features = null; \
	        domain = \"localhost\"; \
	        statement = opt \"Login to the DailyBid app\"; \
	        scheme = opt \"http\"; \
	        salt = \"randomsalt123\"; \
	        session_expires_in = opt (604_800_000_000_000 : nat64); \
	        targets = null; \
	        chain_id = null; \
	        sign_in_expires_in = opt (300_000_000_000 : nat64); \
	    } \
	)"

deploy-siws:
	dfx canister --ic create ic_siws_provider
	dfx deploy --ic ic_siws_provider --argument "( \
	    record { \
	        uri = \"https://daily-bid.com\"; \
	        runtime_features = null; \
	        domain = \"daily-bid.com\"; \
	        statement = opt \"Login to the DailyBid app\"; \
	        scheme = opt \"http\"; \
	        salt = \"randomsalt123\"; \
	        session_expires_in = opt (604_800_000_000_000 : nat64); \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
	        }; \
	        chain_id = opt \"mainnet\"; \
	        sign_in_expires_in = opt (300_000_000_000 : nat64); \
	    } \
	)"	
