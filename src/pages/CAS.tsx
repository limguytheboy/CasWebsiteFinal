import React from 'react';
import { Heart, Users, Lightbulb, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CAS: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-section py-16 md:py-24">
        <div className="container text-center">
          <span className="badge-caramel mb-4 inline-flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Our CAS Journey
          </span>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Baked with Purpose
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Sweet Bites is more than just a bakery—it's a student-led CAS project that combines 
            creativity, community service, and delicious desserts.
          </p>
        </div>
      </section>

      {/* What is CAS */}
      <section className="section-bakery bg-card">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                What is CAS?
              </h2>
              <p className="mt-4 text-muted-foreground">
                CAS stands for <strong>Creativity, Activity, and Service</strong>. It's a core 
                component of the IB Diploma Programme that encourages students to engage in 
                meaningful experiences outside of academic subjects.
              </p>
              <p className="mt-4 text-muted-foreground">
                Through Sweet Bites, we're developing real-world skills while serving our 
                school community with delicious, handmade treats.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lightbulb, title: 'Creativity', desc: 'Developing new recipes and business strategies' },
                { icon: Target, title: 'Activity', desc: 'Hands-on baking and operations management' },
                { icon: Users, title: 'Service', desc: 'Serving our school community with love' },
                { icon: Heart, title: 'Impact', desc: 'Building connections through food' },
              ].map((item, i) => (
                <div key={i} className="card-bakery">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-3 font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-bakery">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
              Our Story
            </h2>
            <div className="mt-6 space-y-4 text-left text-muted-foreground">
              <p>
                Sweet Bites started as a simple idea during a brainstorming session: what if we could 
                combine our love for baking with our desire to create something meaningful for our 
                school community?
              </p>
              <p>
                What began as weekend baking experiments in our homes has grown into a full-fledged 
                student-run bakery. We source quality ingredients, develop our own recipes, and handle 
                everything from marketing to order fulfillment.
              </p>
              <p>
                Every croissant, every macaron, every slice of cake is made with care and dedication. 
                We're not just selling desserts—we're creating experiences and building skills that 
                will last a lifetime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-bakery bg-card">
        <div className="container">
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
            Meet the Team
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Passionate students bringing sweetness to our community
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Sarah Chen', role: 'Head Baker', initial: 'S' },
              { name: 'Marcus Lee', role: 'Operations Lead', initial: 'M' },
              { name: 'Priya Patel', role: 'Marketing Director', initial: 'P' },
              { name: 'James Kim', role: 'Finance Manager', initial: 'J' },
            ].map((member, i) => (
              <div key={i} className="card-bakery text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {member.initial}
                </div>
                <h3 className="mt-4 font-bold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-bakery bg-primary">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
            Support Our Journey
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Every order helps us learn, grow, and serve our community better. Thank you for 
            being part of our CAS adventure!
          </p>
          <div className="mt-8">
            <Link to="/products">
              <Button size="lg" variant="secondary" className="rounded-full">
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CAS;
