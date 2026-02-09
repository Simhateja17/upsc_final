'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const faqs = [
    {
      question: 'The expense windows adapted sir. Wrong widen drawn.',
      answer: 'Offending belonging promotion provision an be oh consulted ourselves it. Blessing welcomed ladyship she met humoured sir breeding her.',
    },
    {
      question: 'Six curiosity day assurance bed necessary?',
      answer: 'Extensive discourse real as an particular principles as. Blessing welcomed ladyship she met humoured sir breeding her.',
    },
    {
      question: 'Produce say the ten moments parties?',
      answer: 'Extensive discourse real as an particular principles as. Blessing welcomed ladyship she met humoured sir breeding her.',
    },
    {
      question: 'Simple innate summer fat appear basket his desire joy?',
      answer: 'Extensive discourse real as an particular principles as. Blessing welcomed ladyship she met humoured sir breeding her.',
    },
    {
      question: 'Outward clothes promise at gravity do excited?',
      answer: 'Extensive discourse real as an particular principles as. Blessing welcomed ladyship she met humoured sir breeding her.',
    },
  ];

  return (
    <section 
      className="relative w-full overflow-hidden flex justify-center py-20"
      style={{
        background: '#FFFFFF',
      }}
    >
      {/* Content Container - 1920px width reference */}
      <div className="relative z-10 w-[1920px] shrink-0 transform scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.8] xl:scale-100 origin-top">
        
        {/* Title Container */}
        <div 
          className="flex items-center justify-center mx-auto mb-12"
          style={{
            width: '967px',
            height: '91px',
          }}
        >
          <h2 
            className="font-lora font-semibold text-center p-0 m-0"
            style={{
              fontSize: '70px',
              lineHeight: '150%',
              letterSpacing: '0.01em',
              color: '#1C2E45',
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div 
          className="flex flex-col gap-0 mx-auto"
          style={{
            width: '1347px',
          }}
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="relative cursor-pointer transition-all duration-300"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E8E8',
                borderRadius: '10px',
                padding: openIndex === index ? '32px 41px' : '28px 41px',
                marginBottom: '10px',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
              }}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            >
              <div className="flex items-center justify-between">
                <h3 
                  className="font-manrope font-extrabold"
                  style={{
                    fontSize: '22px',
                    lineHeight: '22px',
                    letterSpacing: '0',
                    color: '#000000',
                  }}
                >
                  {faq.question}
                </h3>
                
                {/* Plus Icon */}
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: '36px',
                    height: '26px',
                  }}
                >
                  <Image
                    src="/faq-plus-icon.png"
                    alt="Toggle"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              
              {/* Answer - Only show when open */}
              {openIndex === index && (
                <p 
                  className="font-manrope font-medium mt-6"
                  style={{
                    fontSize: '16px',
                    lineHeight: '31px',
                    letterSpacing: '-0.02em',
                    color: '#000000',
                  }}
                >
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FAQ;
