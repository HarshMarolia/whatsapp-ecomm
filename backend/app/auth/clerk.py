import jwt
from jwt import PyJWKClient


class ClerkAuth:
    def __init__(self, jwks_url: str) -> None:
        self._jwks_client = PyJWKClient(
            jwks_url,
            cache_jwk_set=True,
            lifespan=300,
        )

    def pre_warm_cache(self) -> None:
        self._jwks_client.get_jwk_set()

    def verify_token(self, token: str) -> dict:
        signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=60,
        )
