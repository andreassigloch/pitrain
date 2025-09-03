/**
 * DurationSelector Component - Choose 45s or 60s pitch duration
 * Author: andreas@siglochconsulting.com
 */

import React from 'react'

function DurationSelector({ onDurationSelect }) {
  const durations = [
    {
      seconds: 45,
      title: '45 Sekunden',
      subtitle: 'BNI Standard',
      description: 'Klassischer BNI-Pitch für wöchentliche Meetings',
      icon: '🎯',
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      seconds: 60,
      title: '60 Sekunden', 
      subtitle: 'Elevator Pitch',
      description: 'Erweiterte Präsentation mit mehr Details',
      icon: '🚀',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  return (
    <div className="text-center space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Wähle deine Pitch-Dauer
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Entscheide dich für die gewünschte Präsentationslänge. 
          Die KI wird deine Bewertung entsprechend anpassen.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {durations.map((duration) => (
          <div
            key={duration.seconds}
            className="bg-white border-2 border-gray-200 hover:border-primary-300 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer group"
            onClick={() => onDurationSelect(duration.seconds)}
          >
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="text-6xl group-hover:scale-110 transition-transform duration-200">
                {duration.icon}
              </div>

              {/* Title */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {duration.title}
                </h3>
                <p className="text-primary-600 font-medium text-lg">
                  {duration.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {duration.description}
              </p>

              {/* Select Button */}
              <button className={`btn text-white w-full ${duration.color} group-hover:scale-105 transition-all duration-200`}>
                <span className="text-lg font-semibold">
                  {duration.title} wählen
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          💡 Tipps für einen erfolgreichen Pitch:
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div>• Klare Vorstellung (Name, Firma)</div>
          <div>• Konkrete Empfehlungsanfrage</div>
          <div>• Zielkunden definieren</div>
          <div>• Kontaktweg nennen</div>
          <div>• Nutzen deutlich machen</div>
          <div>• Einprägsamen Slogan verwenden</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-start space-x-2">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Wichtiger Hinweis</p>
            <p>Keine Gewähr für Funktion oder Datenschutz. Nutzung auf eigenes Risiko.</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                Mehr Details ↓
              </summary>
              <div className="mt-3 space-y-2 text-gray-600">
                <p className="font-semibold">Diese Anwendung:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Speichert anonyme Statistiken</li>
                  <li>Nutzt Mistral AI zur Auswertung</li>
                  <li>Überträgt Audio-Aufnahmen zur Transkription an Mistral API</li>
                  <li>Speichert KEINE persönlichen Daten oder Nutzerprofile</li>
                  <li>Verwendet Cookies nur für Session-Management</li>
                </ul>
                <p className="mt-3">
                  <span className="font-semibold">Ihre Aufnahmen werden:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Nur für die Analyse verwendet</li>
                  <li>Nicht dauerhaft gespeichert</li>
                  <li>Anonymisiert verarbeitet</li>
                </ul>
                <p className="mt-3 font-medium">
                  Mit der Nutzung der Pitch-Buttons akzeptieren Sie diese Bedingungen.
                </p>
                <p className="mt-2 text-xs">© 2024 Sigloch Consulting</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DurationSelector