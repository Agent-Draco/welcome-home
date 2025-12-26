import { CheckCircle } from "lucide-react";

const benefits = [
  "Intuitive design that users love",
  "Scalable infrastructure for growth",
  "Dedicated 24/7 support team",
  "Regular updates and improvements",
];

const About = () => {
  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
              We Build Digital Experiences That <span className="text-gradient">Matter</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              At Apex, we believe in the power of exceptional digital experiences. 
              Our platform combines cutting-edge technology with intuitive design to help 
              businesses thrive in an increasingly connected world.
            </p>

            {/* Benefits List */}
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-card border border-border overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-8 left-8 w-24 h-24 rounded-2xl bg-primary/30 animate-float" />
              <div className="absolute bottom-12 right-12 w-32 h-32 rounded-full bg-primary/20 animate-float animation-delay-200" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-3xl bg-primary/10 border border-primary/30 glow" />
              
              {/* Center Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center glow">
                <span className="text-primary-foreground font-bold text-3xl">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
