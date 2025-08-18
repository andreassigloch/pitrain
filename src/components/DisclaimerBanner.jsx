/**
 * DisclaimerBanner Component - Legal disclaimer display
 * Author: andreas@siglochconsulting.com
 */

import React from 'react'

function DisclaimerBanner({ onAccept }) {
  return (
    <div className="text-center space-y-6">
      {/* Warning Icon */}
      <div className="flex justify-center">
        <div className="bg-yellow-100 rounded-full p-4">
          <div className="text-6xl">⚠️</div>
        </div>
      </div>

      {/* Disclaimer Text */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Wichtiger Hinweis
        </h2>
        <p className="text-lg text-gray-800 leading-relaxed">
          <strong>Keine Gewähr für Funktion oder Datenschutz.</strong><br />
          <strong>Nutzung auf eigenes Risiko.</strong>
        </p>
        
        <div className="mt-4 text-sm text-gray-600 space-y-2">
          <p>• Diese Anwendung verwendet experimentelle KI-Technologie</p>
          <p>• Audiodaten werden temporär an Mistral AI übertragen</p>
          <p>• Keine Garantie für Genauigkeit der Bewertungen</p>
        </div>
      </div>

      {/* Privacy Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
        <div className="flex items-center space-x-2 text-blue-800">
          <span className="text-xl">🔒</span>
          <div className="text-sm">
            <p><strong>Datenschutz:</strong></p>
            <p>• Keine Nutzer-Registrierung erforderlich</p>
            <p>• Keine permanente Speicherung von Audiodaten</p>
          </div>
        </div>
      </div>

      {/* Accept Button */}
      <div className="pt-4">
        <button
          onClick={onAccept}
          className="btn btn-primary text-xl px-8 py-4 min-w-[200px]"
        >
          ✅ Verstanden, weiter
        </button>
      </div>

      {/* Additional Info */}
      <div className="text-xs text-gray-400 max-w-md mx-auto">
        Durch Klicken auf "Verstanden, weiter" akzeptierst du die obigen Bedingungen 
        und bestätigst, dass du die Risiken verstehst.
      </div>
    </div>
  )
}

export default DisclaimerBanner