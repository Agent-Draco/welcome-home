import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section Header */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get <span className="text-gradient">Started?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join thousands of businesses already transforming their digital presence. 
            Enter your email to begin your journey.
          </p>

          {/* Email Form */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-14 bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            <Button variant="hero" size="lg" className="h-14">
              Subscribe
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Trust Text */}
          <p className="text-muted-foreground text-sm mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
