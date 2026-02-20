'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function QuestionReviewPage() {
  const [showExplanation, setShowExplanation] = useState(true);

  return (
    <div className="flex flex-col min-h-screen panel-recessed">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-[clamp(2rem,4vw,4rem)] px-[clamp(1rem,2vw,3rem)]">
        <div 
          className="card-elevated rounded-[clamp(10px,0.52vw,10px)]"
          style={{ 
            width: 'clamp(700px,50vw,962px)',
            padding: 'clamp(1.5rem,2vw,2.5rem)'
          }}
        >
          {/* Title Section */}
          <div className="flex items-center gap-[clamp(8px,0.625vw,12px)] mb-[clamp(1.5rem,2vw,2rem)]">
            <img 
              src="/question-review-icon.png" 
              alt="Question Review" 
              style={{ 
                width: 'clamp(20px,1.46vw,28px)',
                height: 'clamp(20px,1.46vw,28px)'
              }}
            />
            <h1 
              className="font-arimo font-bold text-[#101828]"
              style={{ 
                fontSize: 'clamp(16px,0.94vw,18px)',
                lineHeight: 'clamp(24px,1.46vw,28px)'
              }}
            >
              Question Review
            </h1>
          </div>

          {/* Question Content */}
          <div className="flex gap-[clamp(1rem,1.25vw,1.5rem)]">
            {/* Question Number */}
            <div 
              className="flex-shrink-0 rounded-full bg-[#F9FAFB] flex items-center justify-center font-arimo text-[#99A1AF]"
              style={{ 
                width: 'clamp(28px,1.67vw,32px)',
                height: 'clamp(28px,1.67vw,32px)',
                fontSize: 'clamp(20px,1.25vw,24px)',
                lineHeight: 'clamp(28px,1.67vw,32px)'
              }}
            >
              1
            </div>

            {/* Question Details */}
            <div className="flex-1">
              {/* Assertion */}
              <div className="mb-[clamp(0.75rem,1vw,1.25rem)]">
                <p 
                  className="font-arimo text-[#364153]"
                  style={{ 
                    fontSize: 'clamp(13px,0.73vw,14px)',
                    lineHeight: 'clamp(18px,1.19vw,22.75px)'
                  }}
                >
                  <span className="font-bold">Assertion (A):</span> Ageing States may face fiscal stress despite successful population stabilisation.
                </p>
              </div>

              {/* Reason */}
              <div className="mb-[clamp(1rem,1.25vw,1.5rem)]">
                <p 
                  className="font-arimo text-[#364153]"
                  style={{ 
                    fontSize: 'clamp(13px,0.73vw,14px)',
                    lineHeight: 'clamp(18px,1.19vw,22.75px)'
                  }}
                >
                  <span className="font-bold">Reason (R):</span> These States face higher pension liabilities along with relatively lower fiscal transfers and political representation.
                </p>
              </div>

              {/* Instruction */}
              <p 
                className="font-arimo text-[#364153] mb-[clamp(1rem,1.25vw,1.5rem)]"
                style={{ 
                  fontSize: 'clamp(13px,0.73vw,14px)',
                  lineHeight: 'clamp(18px,1.19vw,22.75px)'
                }}
              >
                Select the correct answer using the code below:
              </p>

              {/* Answer Options Grid */}
              <div 
                className="grid grid-cols-2 gap-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(1.25rem,1.5vw,2rem)]"
              >
                {/* Option A */}
                <button 
                  className="text-left text-white rounded-[clamp(8px,0.52vw,10px)] transition-all hover:opacity-90"
                  style={{ 
                    background: '#00BBA7',
                    padding: 'clamp(0.75rem,1vw,1.25rem)'
                  }}
                >
                  <div 
                    className="font-arimo"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    <span className="font-bold">A</span> Both A and R are true and R is the correct explanation of A
                  </div>
                </button>

                {/* Option B */}
                <button 
                  className="text-left text-white rounded-[clamp(8px,0.52vw,10px)] transition-all hover:opacity-90"
                  style={{ 
                    background: '#FF3961',
                    padding: 'clamp(0.75rem,1vw,1.25rem)'
                  }}
                >
                  <div 
                    className="font-arimo"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    <span className="font-bold">B</span> Both A and R are true but R is not the correct explanation of A
                  </div>
                </button>

                {/* Option C */}
                <button 
                  className="text-left bg-[#F9FAFB] border border-[#E5E7EB] text-[#364153] rounded-[clamp(8px,0.52vw,10px)] transition-all hover:bg-[#F3F4F6]"
                  style={{ 
                    padding: 'clamp(0.75rem,1vw,1.25rem)'
                  }}
                >
                  <div 
                    className="font-arimo"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    <span className="font-bold">C</span> A is true but R is false
                  </div>
                </button>

                {/* Option D */}
                <button 
                  className="text-left bg-[#F9FAFB] border border-[#E5E7EB] text-[#364153] rounded-[clamp(8px,0.52vw,10px)] transition-all hover:bg-[#F3F4F6]"
                  style={{ 
                    padding: 'clamp(0.75rem,1vw,1.25rem)'
                  }}
                >
                  <div 
                    className="font-arimo"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    <span className="font-bold">D</span> A is false but R is true
                  </div>
                </button>
              </div>

              {/* View Explanation Button */}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2 font-arimo font-bold text-[#101828] hover:opacity-70 transition-opacity mb-[clamp(1rem,1.25vw,1.5rem)]"
                style={{ 
                  fontSize: 'clamp(13px,0.73vw,14px)',
                  lineHeight: 'clamp(18px,1.19vw,22.75px)'
                }}
              >
                View Explanation
                <img 
                  src="/arrow-down-icon.png"
                  alt="Arrow"
                  style={{ 
                    width: 'clamp(14px,0.83vw,16px)',
                    height: 'clamp(14px,0.83vw,16px)'
                  }}
                />
              </button>

              {/* Explanation Section */}
              {showExplanation && (
                <div 
                  className="bg-[#F9FAFB] rounded-[clamp(8px,0.52vw,10px)] border border-[#E5E7EB]"
                  style={{ 
                    padding: 'clamp(1rem,1.25vw,1.5rem)'
                  }}
                >
                  <h3 
                    className="font-arimo font-bold text-[#101828] mb-[clamp(0.75rem,1vw,1.25rem)]"
                    style={{ 
                      fontSize: 'clamp(14px,0.83vw,16px)',
                      lineHeight: 'clamp(20px,1.25vw,24px)'
                    }}
                  >
                    Explanation
                  </h3>
                  <div 
                    className="space-y-[clamp(0.5rem,0.625vw,0.75rem)] font-arimo text-[#364153]"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    <p>• Ageing States like Kerala and Tamil Nadu face fiscal stress despite population stabilisation, as shrinking working-age populations reduce revenue buoyancy while expenditure demands rise. Hence, assertion is correct.</p>
                    <p>• Higher pension liabilities (30% of social spending in ageing states) coincide with lower fiscal transfers (tax devolution favors youthful states with larger populations) and reduced political weight in Parliament/Lok Sabha due to frozen seats. Hence, reason is correct.</p>
                    <p>• The 15th Finance Commission used 2011 census data, which Southern states feel penalizes them for successful population control.</p>
                    <p>• Reason directly explains Assertion by identifying pension pressures and suboptimal central support as core fiscal stressors in demographic transition.</p>
                  </div>
                  <p 
                    className="font-arimo font-bold text-[#101828] mt-[clamp(0.75rem,1vw,1.25rem)]"
                    style={{ 
                      fontSize: 'clamp(13px,0.73vw,14px)',
                      lineHeight: 'clamp(18px,1.19vw,22.75px)'
                    }}
                  >
                    Hence, <span className="text-[#4A5565]">option A is correct.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
