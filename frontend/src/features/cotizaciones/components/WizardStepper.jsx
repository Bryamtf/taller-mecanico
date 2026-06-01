import React from "react";

const WizardStepper = ({ pasoActual, pasos }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {pasos.map((paso, index) => {
          const pasoNumero = index + 1;
          const isActive = pasoNumero === pasoActual;
          const isCompleted = pasoNumero < pasoActual;

          return (
            <React.Fragment key={index}>
              {/* Paso */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                                    ${isActive ? "bg-blue-600 text-white" : ""}
                                    ${isCompleted ? "bg-green-600 text-white" : ""}
                                    ${!isActive && !isCompleted ? "bg-gray-200 text-gray-500" : ""}
                                `}
                >
                  {isCompleted ? "✓" : pasoNumero}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  {paso}
                </span>
              </div>

              {/* Línea conectora */}
              {index < pasos.length - 1 && (
                <div
                  className={`
                                    flex-1 h-0.5 mx-2
                                    ${pasoNumero < pasoActual ? "bg-green-600" : "bg-gray-200"}
                                `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
