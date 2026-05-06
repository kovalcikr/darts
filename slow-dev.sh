set -e

echo "Setting up slow dev..."

curl -X POST http://localhost:3000/api/test/cuescore -H "Content-Type: application/json" -d '{"delays": {"getTournament": 2000}}'
echo ""
curl -X POST http://localhost:3000/api/test/cuescore -H "Content-Type: application/json" -d '{"delays": {"updateMatchScore": 2000}}'
echo ""
curl -X POST http://localhost:3000/api/test/cuescore -H "Content-Type: application/json" -d '{"delays": {"finishMatch": 2000}}'
echo ""
echo "DONE"
