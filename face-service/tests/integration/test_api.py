import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint"""
    response = await client.get("/")
    assert response.status_code == 200
    assert "service" in response.json()


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test health check"""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"