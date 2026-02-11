import React from 'react';
import { Heart, Target, Users, BookOpen, Camera, Lightbulb, Award, Sparkles, Hammer } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const CAS: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section */}
      <section className="hero-section py-16 md:py-24">
        <div className="container text-center">
          <span className="badge-caramel mb-4 inline-flex items-center gap-2">
            <Heart className="h-4 w-4" />
            IB Diploma Programme
          </span>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            CAS Service Project
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A student-led service project aimed at helping our school community through 
            handcrafted baked goods and meaningful connections.
          </p>
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl">
            <AspectRatio ratio={16 / 9}>
              <img
                src="https://images.unsplash.com/photo-1556217477-d325251ece38?w=1200&h=675&fit=crop"
                alt="Students baking together in a kitchen"
                className="h-full w-full object-cover"
              />
            </AspectRatio>
          </div>
        </div>
      </section>

      {/* 2. About the Project */}
      <section className="section-bakery bg-card">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                About the Project
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Beyond Lumina is a student-run bakery created as part of my IB CAS (Creativity, Activity, Service) 
                experience. The project was started to bring our school community together through the joy of 
                freshly baked goods.
              </p>
              <p>
                This project was created because I noticed that students and staff often lacked access to 
                affordable, quality treats during school hours. By providing handmade baked goods, we aim 
                to brighten people's days while building a sense of community.
              </p>
              <p>
                The project helps students, teachers, and staff by offering delicious treats made with care, 
                while also creating opportunities for other students to get involved and learn valuable skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAS Strand Focus */}
      <section className="section-bakery">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                CAS Strand
              </h2>
            </div>
            <div className="card-bakery">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Service</h3>
                  <p className="text-muted-foreground">Primary Focus</p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                This project fits the <strong>Service</strong> strand because it directly benefits our school 
                community. By providing baked goods at affordable prices, we serve students and staff who 
                appreciate having access to quality treats. The project also involves collaboration, where 
                we work together to plan, bake, and distribute products—creating a supportive environment 
                where everyone contributes to helping others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Project Goals */}
      <section className="section-bakery bg-card">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Project Goals
              </h2>
            </div>
            <ul className="space-y-4">
              {[
                'Serve our school community by providing affordable, handmade baked goods',
                'Create a positive and welcoming environment through food and connection',
                'Develop responsibility, teamwork, and organizational skills',
                'Encourage other students to participate and learn new skills',
                'Build a sustainable project that can continue for future students',
              ].map((goal, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="text-muted-foreground">{goal}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. My Role */}
      <section className="section-bakery">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                My Role
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                As the project leader, I took responsibility for planning and organizing our baking schedule, 
                coordinating with team members, and ensuring that everything ran smoothly each week.
              </p>
              <p>
                I personally handled recipe development and testing, making sure each product met our quality 
                standards. I also created this website to help customers browse and order our products easily.
              </p>
              <p>
                Beyond baking, I managed our inventory, tracked orders, and communicated with teachers to 
                arrange pickup times. Working with others taught me how to delegate tasks and support my 
                teammates when they needed help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Project Evidence */}
      <section className="section-bakery bg-card">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Project Evidence
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  src: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=400&fit=crop',
                  caption: 'Preparing fresh croissants for the morning sale',
                },
                {
                  src: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
                  caption: 'Team members decorating cupcakes together',
                },
                {
                  src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
                  caption: 'Fresh bread ready for distribution',
                },
                {
                  src: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=400&fit=crop',
                  caption: 'Students enjoying our baked goods during lunch',
                },
              ].map((image, index) => (
                <div key={index} className="overflow-hidden rounded-2xl">
                  <AspectRatio ratio={3 / 2}>
                    <img
                      src={image.src}
                      alt={image.caption}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </AspectRatio>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {image.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Learning Outcomes */}
      <section className="section-bakery">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                CAS Learning Outcomes
              </h2>
            </div>
            <div className="space-y-6">
              <div className="card-bakery">
                <h3 className="font-bold text-foreground">What I Learned</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>• How to manage a real project from start to finish</li>
                  <li>• The importance of planning ahead and being organized</li>
                  <li>• How to communicate effectively with customers and team members</li>
                  <li>• Basic business skills like budgeting and inventory management</li>
                </ul>
              </div>
              <div className="card-bakery">
                <h3 className="font-bold text-foreground">Skills Developed</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>• Leadership and delegation</li>
                  <li>• Time management and multitasking</li>
                  <li>• Problem-solving under pressure</li>
                  <li>• Baking techniques and food safety</li>
                </ul>
              </div>
              <div className="card-bakery">
                <h3 className="font-bold text-foreground">Challenges Faced</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>• Balancing the project with schoolwork and other commitments</li>
                  <li>• Managing unexpected situations like ingredient shortages</li>
                  <li>• Learning to accept feedback and improve our products</li>
                  <li>• Coordinating schedules with multiple team members</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Impact */}
      <section className="section-bakery bg-card">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Impact of the Project
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong>Who benefited:</strong> Our school community—students, teachers, and staff—all 
                enjoyed access to fresh, affordable baked goods. Team members also benefited by gaining 
                hands-on experience in running a small business.
              </p>
              <p>
                <strong>What changed:</strong> The project created a new tradition at our school. Students 
                now look forward to our weekly sales, and we've inspired other students to start their own 
                service projects.
              </p>
              <p>
                <strong>Why it matters:</strong> Beyond the treats, Beyond Lumina brought people together. 
                It showed that students can make a real difference in their community through initiative, 
                hard work, and a genuine desire to help others.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { number: '200+', label: 'Students Served' },
                { number: '50+', label: 'Baking Sessions' },
                { number: '6', label: 'Team Members' },
              ].map((stat, index) => (
                <div key={index} className="rounded-2xl bg-primary/10 p-6 text-center">
                  <p className="text-3xl font-bold text-primary">{stat.number}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Team Members */}
            <h3 className="mt-10 text-xl font-bold text-foreground text-center">Meet the Team</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Passionate students bringing sweetness to our community
            </p>
            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3">
              {[
                { name: 'Sarah Chen', role: 'Head Baker', initial: 'S' },
                { name: 'Marcus Lee', role: 'Operations Lead', initial: 'M' },
                { name: 'Priya Patel', role: 'Marketing Director', initial: 'P' },
                { name: 'James Kim', role: 'Finance Manager', initial: 'J' },
                { name: 'Emma Wong', role: 'Quality Control', initial: 'E' },
                { name: 'David Park', role: 'Logistics Lead', initial: 'D' },
              ].map((member, i) => (
                <div key={i} className="card-bakery text-center py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {member.initial}
                  </div>
                  <h4 className="mt-3 font-bold text-foreground text-sm">{member.name}</h4>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. Conclusion */}
      <section className="section-bakery bg-primary">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
              Conclusion
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-primary-foreground/90">
              Through Beyond Lumina, I discovered that service is not just about doing something for others—it's 
              about growing alongside them. This project taught me responsibility, patience, and the joy of 
              creating something meaningful.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/90">
              What started as a simple idea has become a lasting part of our school community. I am proud 
              of what we accomplished together, and I hope this project continues to inspire future students 
              to serve their communities in their own unique ways.
            </p>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground">
                <Heart className="h-4 w-4" />
                Thank you for supporting our CAS journey
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">

      {/* Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Hammer className="h-8 w-8" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold">
        Page Under Construction
      </h1>

      {/* Subtitle */}
      <p className="mt-4 max-w-md text-muted-foreground">
        We're currently building this section. Please check back soon.
      </p>

    </div>
  )
}
//export default CAS;
export default ComingSoon;
