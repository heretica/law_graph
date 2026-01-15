'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-datack-black text-datack-light">
      {/* Header */}
      <header className="border-b border-datack-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-datack-yellow rounded-lg flex items-center justify-center">
              <span className="text-datack-black font-bold text-xl">D</span>
            </div>
            <span className="text-xl font-semibold">Datack</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-datack-gray hover:text-datack-light transition-colors">
              Graphe
            </Link>
            <Link href="/about" className="text-datack-yellow">
              À propos
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-datack-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Grand Débat National
          </h1>
          <p className="text-xl md:text-2xl text-datack-gray mb-8">
            Exploration interactive des connexions citoyennes
          </p>
          <div className="inline-block bg-datack-dark border border-datack-yellow px-6 py-3 rounded-datack-lg">
            <p className="text-datack-yellow font-medium italic">
              &ldquo;Créer des rencontres, Activer les publics&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 border-b border-datack-border">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-datack-yellow">
            Notre Mission
          </h2>
          <div className="space-y-6 text-lg text-datack-light/90">
            <p>
              En 2019, le Grand Débat National a recueilli plus de 1,9 million de contributions
              citoyennes à travers la France. Parmi elles, les <strong>Cahiers de Doléances</strong>
              constituent un témoignage unique de la parole citoyenne dans 50 communes de Charente-Maritime.
            </p>
            <p>
              Notre mission est de rendre ces contributions <strong>accessibles et interprétables</strong>
              grâce à une technologie de pointe : le GraphRAG (Retrieval-Augmented Generation sur graphe
              de connaissances).
            </p>
            <p>
              Chaque réponse générée par notre système est <strong>traçable de bout en bout</strong>,
              permettant de naviguer du texte citoyen original jusqu&apos;à la synthèse thématique,
              en passant par les entités et relations qui structurent la connaissance.
            </p>
          </div>
        </div>
      </section>

      {/* L'équipe Datack */}
      <section className="py-16 border-b border-datack-border bg-datack-dark/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-datack-yellow">
            L&apos;équipe Datack
          </h2>
          <div className="space-y-6 text-lg text-datack-light/90">
            <p>
              <strong>Datack</strong> est l&apos;agence qui ne renonce pas à changer le monde.
              Spécialisée dans la mobilisation citoyenne et l&apos;engagement public, nous combinons
              expertise data et design pour créer des expériences qui activent les publics.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6 text-center">
                <div className="text-3xl mb-2">🗼</div>
                <h3 className="font-semibold mb-1">Paris</h3>
                <p className="text-datack-gray text-sm">Siège social</p>
              </div>
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6 text-center">
                <div className="text-3xl mb-2">⚓</div>
                <h3 className="font-semibold mb-1">Marseille</h3>
                <p className="text-datack-gray text-sm">Antenne Sud</p>
              </div>
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6 text-center">
                <div className="text-3xl mb-2">🇪🇺</div>
                <h3 className="font-semibold mb-1">Bruxelles</h3>
                <p className="text-datack-gray text-sm">Bureau européen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La Base Citoyenne */}
      <section className="py-16 border-b border-datack-border">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-datack-yellow">
            La Base Citoyenne
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Données</h3>
              <ul className="space-y-3 text-datack-light/90">
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span><strong>50 communes</strong> de Charente-Maritime</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span><strong>8 000+ entités</strong> extraites et typées</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span><strong>12 000+ relations</strong> entre concepts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span><strong>24 types d&apos;entités</strong> dans l&apos;ontologie civique</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Thématiques</h3>
              <ul className="space-y-3 text-datack-light/90">
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span>Fiscalité et dépenses publiques</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span>Organisation de l&apos;État et services publics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span>Transition écologique</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-datack-yellow">▸</span>
                  <span>Démocratie et citoyenneté</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technologie */}
      <section className="py-16 border-b border-datack-border bg-datack-dark/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-datack-yellow">
            Technologie
          </h2>
          <div className="space-y-6 text-lg text-datack-light/90">
            <p>
              Notre plateforme repose sur une architecture <strong>GraphRAG</strong>
              (Graph Retrieval-Augmented Generation) qui combine :
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6">
                <h3 className="font-semibold text-datack-yellow mb-3">Graphe de connaissances</h3>
                <p className="text-datack-gray">
                  Ontologie civique à 24 types d&apos;entités et 30+ types de relations,
                  structurant les contributions citoyennes.
                </p>
              </div>
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6">
                <h3 className="font-semibold text-datack-yellow mb-3">Embeddings vectoriels</h3>
                <p className="text-datack-gray">
                  Représentation sémantique dense pour la recherche par similarité
                  et le clustering thématique.
                </p>
              </div>
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6">
                <h3 className="font-semibold text-datack-yellow mb-3">Génération augmentée</h3>
                <p className="text-datack-gray">
                  Synthèses générées par LLM, enrichies par le contexte
                  du graphe et les citations sources.
                </p>
              </div>
              <div className="bg-datack-dark border border-datack-border rounded-datack-md p-6">
                <h3 className="font-semibold text-datack-yellow mb-3">Interprétabilité</h3>
                <p className="text-datack-gray">
                  Chaîne de provenance complète : de la réponse au texte citoyen
                  original, en passant par les entités.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-datack-yellow">
            Nous Contacter
          </h2>
          <p className="text-lg text-datack-light/90 mb-8">
            Vous souhaitez en savoir plus sur notre approche GraphRAG
            ou explorer vos propres données citoyennes ?
          </p>
          <a
            href="https://datack.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-datack-yellow text-datack-black font-semibold px-8 py-3 rounded-datack-md hover:bg-datack-yellow-bright transition-colors"
          >
            Visiter datack.fr
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-datack-border py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-datack-gray">
          <p>© 2024 Datack. Tous droits réservés.</p>
          <p className="mt-2 text-sm">
            Grand Débat National - Cahiers de Doléances 2019
          </p>
        </div>
      </footer>
    </main>
  )
}
