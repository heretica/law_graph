# Principe et contraintes de conception #1 
Les noeuds qui s'affichent doivent toujours avoir des relations. Les noeuds orphelins ne sont pas admis dans l'interface.

# Principe et contraintes de conception #2
Les livres sont les entités "coeur" du graphe. Ils doivent toujours être le coeur de toutes les requêtes et visualisations de graphe 

# Principe et contraintes de conception #3
Les zones inter-livres doivent être investiguées en priorité par le graphRAG.

# "Principe de conception #4
Toujours laisser de l'espace entre les noeuds pour voir les relations"

# Principe de conception #5
La bibliothèque borges doit permettre une interprétatbilité de bout-en-bout du graphRAG, c'est à dire qu'on doit pouvoir naviguer du chunk de texte jusqu'à la réponse du RAG en passant par les noeuds et relations qui ont permis de les modéliser.

## Active Technologies
- Neo4j 5.14+ (relationship edits, provenance chains, edit history), Railway data volume (book_data mounted from local) (001-interactive-graphrag-refinement)

## Recent Changes
- 001-interactive-graphrag-refinement: Added Neo4j 5.14+ (relationship edits, provenance chains, edit history), Railway data volume (book_data mounted from local)
# IMPORTANT TESTING CONSIDERATIONS : 
1. always launch the reconciliation API before the interface
2. as the long as there are error in the browser console, no further testing can be done.
3. Webpack issues is not to be addressed with clearing the cache, the issue is elsewhere