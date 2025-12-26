const Footer = () => {
  const links = {
    Product: ["Features", "Pricing", "Integrations", "API"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Documentation", "Help Center", "Community", "Changelog"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-semibold text-foreground">Apex</span>
            </a>
            <p className="text-muted-foreground max-w-xs">
              Building the future of digital experiences, one pixel at a time.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Apex. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
              LinkedIn
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
