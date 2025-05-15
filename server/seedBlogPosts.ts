import { db } from './db';
import { blogPosts, blogCategories, blogPostCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // First check if we already have blog posts
    const existingPosts = await db.select({ count: db.fn.count() }).from(blogPosts);
    const postCount = parseInt(existingPosts[0].count.toString(), 10);
    
    if (postCount > 0) {
      console.log(`Database already has ${postCount} blog posts. Skipping seeding.`);
      return;
    }

    // Categories
    console.log('Creating blog categories...');
    const categoryData = [
      { name: 'Rights & Benefits', slug: 'rights-benefits' },
      { name: 'Organizing', slug: 'organizing' },
      { name: 'Negotiations', slug: 'negotiations' },
      { name: 'Legal Updates', slug: 'legal-updates' },
      { name: 'Union History', slug: 'union-history' }
    ];

    for (const category of categoryData) {
      await db.insert(blogCategories).values(category);
    }

    const categories = await db.select().from(blogCategories);
    console.log(`Created ${categories.length} categories`);

    // Blog Posts
    console.log('Creating blog posts...');
    const blogPostData = [
      {
        title: 'Understanding Your Union Contract: Key Rights to Know',
        slug: 'understanding-your-union-contract-key-rights',
        excerpt: 'A comprehensive overview of the essential rights and protections typically found in union contracts, and how to identify them in your own agreement.',
        content: `
# Understanding Your Union Contract: Key Rights to Know

Union contracts (collective bargaining agreements) are powerful documents that establish your rights, benefits, and working conditions. This guide will help you understand the key provisions to look for in your contract.

## Wages and Compensation

Most contracts include detailed wage structures, including:
- Base pay rates and scheduled increases
- Overtime calculation methods
- Shift differentials
- Holiday pay provisions
- Longevity or seniority-based increases

Understanding these provisions helps ensure you're being paid correctly for all hours worked.

## Job Security and Discipline

Your contract likely includes important job security provisions:
- "Just cause" requirement for discipline/termination
- Progressive discipline procedures
- Probationary periods for new employees
- Seniority rights for layoffs and recalls
- Grievance procedures to challenge management actions

These protections prevent arbitrary treatment and establish fair processes for workplace issues.

## Benefits

Contracts typically secure important benefits:
- Health insurance coverage details
- Retirement/pension provisions
- Paid time off (vacations, holidays, sick leave)
- Family leave policies
- Education or training benefits

These negotiated benefits often provide substantial value beyond your base wages.

## Work Rules and Conditions

Look for these important workplace protections:
- Hours of work and scheduling requirements
- Safety and health provisions
- Job classification details
- Workload limitations
- Break and lunch period requirements

These rules help maintain fair and safe working conditions.

## How to Use This Information

1. Locate your contract (ask your union representative if you don't have a copy)
2. Identify these key sections in your agreement
3. Note any questions you have for your union representative
4. Keep your contract accessible for reference when workplace issues arise

Remember that your negotiated contract represents years of collective action by union members. Understanding your rights is the first step to ensuring they're respected in the workplace.
        `,
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        authorId: null,
        publishedAt: new Date(),
        isFeatured: true
      },
      {
        title: 'The Grievance Process Explained: Standing Up for Your Rights',
        slug: 'grievance-process-explained',
        excerpt: 'A step-by-step guide to understanding and navigating the grievance process when you believe your contract rights have been violated.',
        content: `
# The Grievance Process Explained: Standing Up for Your Rights

When you believe your contract rights have been violated, the grievance process is your formal mechanism for seeking resolution. This guide explains how to navigate this important process effectively.

## What Is a Grievance?

A grievance is a formal complaint that your employer has violated the terms of your collective bargaining agreement. Common examples include:

- Discipline without just cause
- Incorrect pay or benefits
- Improper job assignments
- Denial of seniority rights
- Unsafe working conditions
- Discrimination or harassment

## The Typical Grievance Process

While processes vary by contract, most follow these general steps:

### 1. Informal Resolution
Before filing a formal grievance, you may want to discuss the issue with your supervisor. Many problems can be resolved through simple conversation. Document this discussion.

### 2. Filing the Grievance
If informal resolution fails, work with your union steward to file a written grievance. This typically includes:
- Clear description of the contract violation
- Date(s) of the violation
- Remedy you're seeking
- Relevant contract articles

### 3. Step 1 Meeting
The first formal step usually involves a meeting between you, your union representative, and your immediate supervisor. The supervisor will provide a written response to your grievance.

### 4. Further Steps
If the grievance isn't resolved at Step 1, it proceeds through additional steps, potentially including:
- Department head review
- Human resources or labor relations review
- Top management review

### 5. Arbitration
If all internal steps fail to resolve the issue, your union may take the case to arbitration. An independent arbitrator will hear evidence from both sides and make a binding decision.

## Tips for a Successful Grievance

1. **Document everything**: Keep records of all incidents, conversations, and relevant documents.
2. **Know your timeline**: Most contracts have strict time limits for filing grievances.
3. **Be specific**: Clearly identify which contract provisions were violated.
4. **Stay professional**: Even when frustrated, maintain a professional demeanor.
5. **Work with your steward**: Your union representatives have experience with the process.

## When to Contact Your Union Representative

Contact your steward or union representative immediately if:
- You're called to a meeting that could lead to discipline
- You notice contract violations affecting you or coworkers
- You have questions about your rights under the contract
- You need help documenting workplace issues

Remember that the grievance process is one of the most important benefits of union membership. It provides a formal mechanism to enforce your contractual rights and ensure fair treatment in the workplace.
        `,
        imageUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        authorId: null,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isFeatured: true
      },
      {
        title: 'Preparing for Contract Negotiations: What Members Should Know',
        slug: 'preparing-for-contract-negotiations',
        excerpt: 'How members can effectively participate in the contract negotiation process and make their voices heard in shaping their working conditions.',
        content: `
# Preparing for Contract Negotiations: What Members Should Know

Contract negotiations represent a critical opportunity to improve your working conditions, wages, and benefits. This guide explains how you can participate effectively in this important process.

## The Negotiation Timeline

Most contract negotiations follow this general pattern:

1. **Pre-negotiation surveys**: 3-6 months before contract expiration
2. **Proposal development**: 2-4 months before expiration
3. **Negotiating committee selection**: 2-3 months before expiration
4. **Initial negotiations**: Beginning 1-2 months before expiration
5. **Intensive bargaining**: Approaching and possibly after expiration
6. **Tentative agreement**: When all terms are agreed upon
7. **Ratification vote**: Members vote to accept or reject the contract
8. **Implementation**: New contract takes effect

## How to Participate Effectively

### Respond to Surveys
When your union distributes pre-negotiation surveys, provide thoughtful responses about your priorities. This data helps the negotiating team understand membership concerns.

### Attend Meetings
Participate in contract campaign meetings to:
- Learn about the negotiation process
- Share your workplace experiences
- Hear about developments at the bargaining table
- Build solidarity with fellow members

### Volunteer
Consider volunteering for:
- The negotiating committee
- Contract action team
- Communications committee
- Research team

### Share Your Expertise
If you have specialized knowledge (healthcare benefits, pension plans, industry standards), share this expertise with your negotiating committee.

### Talk with Coworkers
Have conversations with colleagues about priorities and concerns. Building consensus strengthens your union's position.

## What to Expect During Negotiations

### Normal Challenges
- Management typically starts with low offers
- Some issues may take multiple sessions to resolve
- Progress often seems slow initially
- Tensions can increase as deadline approaches

### Possible Outcomes
1. **Settlement before deadline**: Ideal but not always possible
2. **Extension**: Continuing to work under the old contract while negotiating
3. **Working without a contract**: Continuing work while negotiations proceed
4. **Job actions**: Work-to-rule, informational picketing, or strikes
5. **Imposed terms**: Management may implement terms without agreement

## Preparing Yourself

1. **Build savings** if possible before negotiations begin
2. **Document workplace issues** that should be addressed
3. **Update your contact information** with the union
4. **Stay informed** through official union communications
5. **Be skeptical** of management communications about negotiations

Remember that your active participation strengthens your union's position at the bargaining table. Collective power comes from engaged members who demonstrate unity and determination throughout the negotiation process.
        `,
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        authorId: null,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isFeatured: false
      },
      {
        title: 'Recent Legal Decisions Affecting Union Rights',
        slug: 'recent-legal-decisions-affecting-union-rights',
        excerpt: 'An analysis of important court decisions and legislative changes that impact union members' rights and how they might affect your workplace.',
        content: `
# Recent Legal Decisions Affecting Union Rights

The legal landscape for labor unions constantly evolves through court decisions and legislative changes. This article summarizes recent developments that may affect your rights as a union member.

## Supreme Court Decisions

### Cedar Point Nursery v. Hassid (2021)
This decision limited union organizers' access to agricultural workplaces in California. The Court ruled that a state regulation allowing union organizers to access private farm property constituted a "taking" under the Fifth Amendment.

**Potential impact**: More challenges to union access rights on employer property, potentially affecting organizing campaigns and member outreach.

### Janus v. AFSCME (2018)
While not recent, this landmark decision continues to affect public sector unions. The Court ruled that public employees cannot be required to pay union fees as a condition of employment.

**Potential impact**: Ongoing challenges for public sector unions in maintaining membership and resources.

## National Labor Relations Board Decisions

### McLaren Macomb (2023)
The NLRB ruled that employers cannot offer severance agreements that prohibit workers from making disparaging statements about the employer or disclosing terms of the agreement.

**Potential impact**: Strengthens workers' rights to discuss workplace conditions even after leaving employment.

### Amazon Labor Union Cases (2022-2023)
The NLRB has issued multiple complaints against Amazon regarding interference with unionization efforts.

**Potential impact**: Establishes precedent for protecting organizing rights in modern warehouse and logistics environments.

## State-Level Developments

### California Fast Food Workers Law (AB 257)
This law creates a council to establish industry-wide standards for wages, hours, and working conditions for fast-food workers.

**Potential impact**: Could create a model for sectoral bargaining approaches in other states and industries.

### Illinois Workers' Rights Amendment (2022)
Illinois voters approved a constitutional amendment guaranteeing workers the fundamental right to organize and bargain collectively.

**Potential impact**: Provides state-level protection for organizing rights regardless of federal changes.

## Legislative Proposals to Watch

### PRO Act
The Protecting the Right to Organize Act would significantly strengthen labor laws, though its passage remains uncertain.

Key provisions include:
- Penalties for employers who violate workers' rights
- Streamlined union election processes
- Ban on permanent replacement of striking workers
- Override of state "right-to-work" laws

**Potential impact**: Would represent the most significant pro-labor reform in decades if passed.

## What This Means for You

1. **Stay informed** about legal developments affecting your industry
2. **Participate** in your union's legislative and political activities
3. **Document** any potential violations of your rights in the workplace
4. **Report concerns** to your union representative promptly
5. **Support** efforts to strengthen labor laws at state and federal levels

Your union's legal team continually monitors these developments and works to protect members' rights. Contact your representative if you have specific questions about how these changes might affect your workplace.
        `,
        imageUrl: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        authorId: null,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isFeatured: false
      },
      {
        title: 'The History of Labor Unions: Struggles That Secured Your Rights',
        slug: 'history-of-labor-unions',
        excerpt: 'Exploring the rich history of the labor movement and how past struggles have shaped the workplace protections we have today.',
        content: `
# The History of Labor Unions: Struggles That Secured Your Rights

Many workplace rights we take for granted today were secured through the sacrifice and struggle of union members throughout history. This article highlights key moments in labor history that shaped today's workplace.

## Early Labor Movement (1800s)

### The First Unions
The early 1800s saw the formation of the first trade unions in industries like printing, shoemaking, and carpentry. These early unions fought for basic dignities:
- A 10-hour workday (down from 12-16 hours)
- Safe working conditions
- Fair wages
- The right to organize without persecution

### The Great Railroad Strike of 1877
One of the first major labor uprisings occurred when railroad workers protested wage cuts. The strike spread across the country and was violently suppressed by militias and federal troops.

**Legacy**: Demonstrated the power of worker solidarity across geographic regions and raised public awareness about labor conditions.

## The Progressive Era (1890s-1920s)

### The Homestead Strike (1892)
Steelworkers at the Carnegie Steel Company faced violent confrontation when management brought in Pinkerton guards to break their union.

**Legacy**: Highlighted the extreme measures companies would take to prevent unionization and the dangers workers faced.

### Triangle Shirtwaist Factory Fire (1911)
146 workers, mostly young immigrant women, died in a factory fire because exits were locked to prevent unauthorized breaks. This tragedy sparked outrage and reform.

**Legacy**: Led directly to workplace safety laws and building codes that protect workers today.

### The Lawrence Textile Strike (1912)
When textile companies cut wages, 20,000 workers—many immigrant women—walked out with the slogan "Bread and Roses," demanding both fair wages and dignity.

**Legacy**: Demonstrated the power of industrial unionism that included all workers regardless of skill level, gender, or ethnicity.

## The Labor Movement Matures (1930s-1950s)

### The Wagner Act (1935)
Also known as the National Labor Relations Act, this landmark legislation guaranteed workers the right to organize, bargain collectively, and strike.

**Legacy**: Created the legal framework for union recognition that persists today.

### The Flint Sit-Down Strike (1936-37)
Auto workers occupied General Motors plants for 44 days, refusing to leave until GM recognized their union.

**Legacy**: Popularized the sit-down strike tactic and led to the unionization of the auto industry.

### The Steel Strike of 1946
After World War II, 750,000 steelworkers struck for better wages and working conditions.

**Legacy**: Helped establish post-war labor-management relations and middle-class prosperity.

## Civil Rights and Labor (1960s-1970s)

### Memphis Sanitation Strike (1968)
African American sanitation workers struck with the slogan "I Am A Man," demanding recognition, safety improvements, and fair wages. Dr. Martin Luther King Jr. was assassinated while supporting this strike.

**Legacy**: Highlighted the connection between labor rights and civil rights.

### United Farm Workers Formation (1962)
César Chávez and Dolores Huerta organized farm workers and led the Delano Grape Strike and Boycott.

**Legacy**: Brought attention to the plight of agricultural workers and demonstrated the power of consumer boycotts.

## Recent History (1980s-Present)

### PATCO Strike and Aftermath (1981)
When air traffic controllers struck, President Reagan fired 11,000 workers, signaling a new era of opposition to labor.

**Legacy**: Began a period of union decline and aggressive anti-union tactics.

### Justice for Janitors (1990s)
Service Employees International Union organized janitors in major cities, using community support and direct action.

**Legacy**: Developed new organizing models for vulnerable workers.

### Teacher Strikes (2018-2019)
Educators in West Virginia, Oklahoma, Arizona, and other states walked out to protest low pay and education funding cuts.

**Legacy**: Revitalized public support for labor action and improved conditions for educators.

## Why This History Matters

Understanding labor history helps us:
1. Appreciate the sacrifices made to secure today's workplace rights
2. Recognize that progress comes through collective action
3. Learn effective strategies from past movements
4. Understand the cycles of labor relations over time
5. Connect our current struggles to a proud tradition of worker activism

The rights in your union contract weren't given freely—they were won through generations of solidarity and struggle. Honoring this history means continuing to defend and expand these hard-won protections.
        `,
        imageUrl: 'https://images.unsplash.com/photo-1588611911587-7bc8ffd4d05d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        authorId: null,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isFeatured: true
      }
    ];

    for (const post of blogPostData) {
      const [insertedPost] = await db.insert(blogPosts).values(post).returning();
      
      // Assign random categories to each post
      // Rights & Benefits for the first post
      if (post.slug === 'understanding-your-union-contract-key-rights') {
        const rightsCategory = categories.find(c => c.slug === 'rights-benefits');
        if (rightsCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: rightsCategory.id
          });
        }
      }
      
      // Organizing and Union History for the history post
      if (post.slug === 'history-of-labor-unions') {
        const historyCategory = categories.find(c => c.slug === 'union-history');
        const organizingCategory = categories.find(c => c.slug === 'organizing');
        
        if (historyCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: historyCategory.id
          });
        }
        
        if (organizingCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: organizingCategory.id
          });
        }
      }
      
      // Negotiations category for the negotiations post
      if (post.slug === 'preparing-for-contract-negotiations') {
        const negotiationsCategory = categories.find(c => c.slug === 'negotiations');
        if (negotiationsCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: negotiationsCategory.id
          });
        }
      }
      
      // Legal Updates for the legal decisions post
      if (post.slug === 'recent-legal-decisions-affecting-union-rights') {
        const legalCategory = categories.find(c => c.slug === 'legal-updates');
        if (legalCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: legalCategory.id
          });
        }
      }
      
      // Rights & Benefits for the grievance process post
      if (post.slug === 'grievance-process-explained') {
        const rightsCategory = categories.find(c => c.slug === 'rights-benefits');
        if (rightsCategory) {
          await db.insert(blogPostCategories).values({
            postId: insertedPost.id,
            categoryId: rightsCategory.id
          });
        }
      }
    }

    console.log(`Created ${blogPostData.length} blog posts`);
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Execute the seeding function
seedDatabase().catch(console.error);