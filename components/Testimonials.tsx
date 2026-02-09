import React from 'react';
import Image from 'next/image';

const testimonials = [
  {
    text: "“Teachings of the great explore of truth, the master-builder of human happiness. no one rejects,dislikes, or avoids pleasure itself, pleasure itself”",
    author: null,
    role: null,
    image: null,
  },
  {
    text: "“Complete account of the system and expound the actual Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots”",
    author: "Dannette P. Cervantes",
    role: "Web Design",
    image: "/testimonial-avatar-1.png",
  },
  {
    text: "“There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour”",
    author: "Clara R. Altman",
    role: "UI&UX Design",
    image: "/testimonial-avatar-2.png",
  }
];

const Testimonials = () => {
  return (
    <section 
      className="w-full"
      style={{
        background: 'linear-gradient(180deg, #F5F3EF 0%, #EDE9E3 100%)',
        paddingTop: 'clamp(3rem, 5vw, 6.25rem)',
        paddingBottom: 'clamp(3rem, 5vw, 6.25rem)',
      }}
    >
      <div className="container-responsive">
        {/* Heading */}
        <h2 
          className="font-lora font-bold text-center text-[#1C2E45] mb-[clamp(2rem,4vw,5rem)]"
          style={{
            fontSize: 'clamp(2rem, 3.385vw, 4.063rem)',
            lineHeight: '150%',
            letterSpacing: '0.01em',
          }}
        >
          What our toppers say
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(1.5rem,2.083vw,2.5rem)]">
          {testimonials.map((item, index) => (
            <div 
              key={index}
              className="bg-white p-[clamp(1.5rem,2.083vw,2.5rem)] rounded-[10px] flex flex-col items-center"
              style={{
                boxShadow: '0px 4px 88px 0px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="flex-grow flex items-center">
                <p 
                  className="font-roboto font-normal text-[#525252] text-center"
                  style={{
                     fontSize: 'clamp(1rem, 0.99vw, 1.188rem)', // ~19px
                     lineHeight: '156%',
                     letterSpacing: '0.02em',
                  }}
                >
                  {item.text}
                </p>
              </div>

              {/* Author Info */}
              {(item.author || item.image) && (
                <div className="flex items-center gap-4 mt-8 w-full justify-center">
                  {item.image && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.author || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {item.author && (
                    <div className="text-left">
                      <h4
                        className={`font-medium text-[#353535] ${index === 1 ? 'font-roboto' : 'font-poppins'}`}
                        style={{
                          fontSize: '17px',
                          lineHeight: '156%',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {item.author}
                      </h4>
                      {item.role && (
                         <p
                           className={`text-[#8E8E8E] ${index === 1 ? 'font-roboto' : 'font-poppins'}`}
                           style={{
                             fontSize: '13px',
                             lineHeight: '156%',
                             letterSpacing: '0.02em',
                             fontWeight: 400,
                           }}
                         >
                           {item.role}
                         </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
