import { Zap, Shield, Layers, Rocket, Globe, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance that loads in milliseconds, keeping your users engaged.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Enterprise-grade security built into every layer of our platform.",
  },
  {
    icon: Layers,
    title: "Modular Architecture",
    description: "Flexible components that scale with your growing business needs.",
  },
  {
    icon: Rocket,
    title: "Quick Deployment",
    description: "Go from concept to production in record time with our streamlined workflow.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "CDN-powered delivery ensuring fast access from anywhere in the world.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Instant synchronization across all devices and platforms.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features designed to help you build, scale, and succeed in the digital world.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
