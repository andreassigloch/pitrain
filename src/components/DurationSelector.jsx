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
    </div>
  )
}

export default DurationSelector