const fs = require('fs');
const path = require('path');

const base = path.resolve('data/homework/student-001');
const subjects = ['Math', 'Chinese', 'English', 'Science'];

const today = new Date('2026-06-14T00:00:00+08:00');

function addDays(n) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

function shanghaiISO(d) {
  // Format a Date as Asia/Shanghai ISO 8601 with explicit +08:00 offset.
  const local = d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  return local.replace(' ', 'T') + '+08:00';
}

function dateOnly(d) {
  return shanghaiISO(d).slice(0, 10);
}

function at2359(dateStr) {
  const d = new Date(`${dateStr}T23:59:00+08:00`);
  return shanghaiISO(d);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const postsBySubject = {
  Math: {
    subject: 'Math',
    description: 'Advanced Calculus and Algebra',
    posts: [
      {
        id: 'math-001',
        type: 'assignment',
        title: 'Fourier Series Problem Set',
        content: 'Complete Exercises 4.1–4.9 focusing on periodic functions. Show all working.',
        assignedDateTime: shanghaiISO(addDays(-4)),
        dueDate: dateOnly(addDays(1)),
        status: 'assigned',
        maxPoints: 100,
        attachments: ['problem_set_4.pdf']
      },
      {
        id: 'math-002',
        type: 'assignment',
        title: 'Linear Algebra Quiz Review',
        content: 'Review eigenvalues and eigenvectors. Practice questions handed out in class.',
        assignedDateTime: shanghaiISO(addDays(-2)),
        dueDate: dateOnly(addDays(5)),
        status: 'assigned',
        maxPoints: 50,
        attachments: ['eigenvalues_practice.pdf']
      },
      {
        id: 'math-003',
        type: 'post',
        title: 'Calculator reminder',
        content: "Bring a scientific calculator for tomorrow's quiz.",
        postedAt: shanghaiISO(addDays(-1)),
        author: 'Mr. Tan',
        attachments: []
      }
    ]
  },
  Chinese: {
    subject: 'Chinese',
    description: 'Mandarin Language and Literature',
    posts: [
      {
        id: 'chi-001',
        type: 'assignment',
        title: '《背影》 Reading Response',
        content: 'Write a 300-character reflection on the theme of father-son relationships.',
        assignedDateTime: shanghaiISO(addDays(-3)),
        dueDate: dateOnly(addDays(0)),
        status: 'assigned',
        maxPoints: 40,
        attachments: []
      },
      {
        id: 'chi-002',
        type: 'assignment',
        title: 'Vocabulary Dictation 6',
        content: 'Memorise characters 1–30 on list 6.',
        assignedDateTime: shanghaiISO(addDays(-1)),
        dueDate: dateOnly(addDays(7)),
        status: 'assigned',
        maxPoints: 30,
        attachments: ['vocab_list_6.pdf']
      },
      {
        id: 'chi-003',
        type: 'post',
        title: 'Culture club notice',
        content: 'Calligraphy workshop this Friday after school.',
        postedAt: shanghaiISO(addDays(-2)),
        author: 'Ms. Li',
        attachments: []
      }
    ]
  },
  English: {
    subject: 'English',
    description: 'English Literature and Composition',
    posts: [
      {
        id: 'eng-001',
        type: 'assignment',
        title: 'Persuasive Essay Draft',
        content: 'Submit a complete first draft of your persuasive essay on social media.',
        assignedDateTime: shanghaiISO(addDays(-5)),
        dueDate: dateOnly(addDays(2)),
        status: 'assigned',
        maxPoints: 120,
        attachments: ['essay_rubric.pdf']
      },
      {
        id: 'eng-002',
        type: 'assignment',
        title: 'Romeo and Juliet Scene Analysis',
        content: 'Analyse Act 2 Scene 2 in 500 words.',
        assignedDateTime: shanghaiISO(addDays(-2)),
        dueDate: dateOnly(addDays(8)),
        status: 'assigned',
        maxPoints: 80,
        attachments: []
      },
      {
        id: 'eng-003',
        type: 'post',
        title: 'Book club pick',
        content: 'Next month\'s book: "The Giver" by Lois Lowry.',
        postedAt: shanghaiISO(addDays(-3)),
        author: 'Mr. Smith',
        attachments: []
      }
    ]
  },
  Science: {
    subject: 'Science',
    description: 'Integrated Science: Physics, Chemistry and Biology',
    posts: [
      {
        id: 'sci-001',
        type: 'assignment',
        title: 'Photosynthesis Lab Report',
        content: 'Write up the photosynthesis experiment, including results and conclusion.',
        assignedDateTime: shanghaiISO(addDays(-6)),
        dueDate: dateOnly(addDays(3)),
        status: 'assigned',
        maxPoints: 90,
        attachments: ['lab_template.docx']
      },
      {
        id: 'sci-002',
        type: 'assignment',
        title: 'Forces and Motion Worksheet',
        content: "Complete the worksheet on Newton's laws.",
        assignedDateTime: shanghaiISO(addDays(-1)),
        dueDate: dateOnly(addDays(10)),
        status: 'assigned',
        maxPoints: 60,
        attachments: ['forces_worksheet.pdf']
      },
      {
        id: 'sci-003',
        type: 'post',
        title: 'Lab safety reminder',
        content: 'Wear goggles and closed-toe shoes in the lab.',
        postedAt: shanghaiISO(addDays(-1)),
        author: 'Dr. Wong',
        attachments: []
      }
    ]
  }
};

for (const subject of subjects) {
  const dir = path.join(base, subject);
  ensureDir(dir);
  ensureDir(path.join(dir, 'Files'));

  fs.writeFileSync(
    path.join(dir, 'Description.md'),
    `# ${subject}\n\n${postsBySubject[subject].description}\n`
  );
  fs.writeFileSync(path.join(dir, 'Files', '.gitkeep'), '');

  const data = postsBySubject[subject];
  data.posts.forEach((p) => {
    if (p.type === 'assignment' && p.dueDate) {
      p.dueDateTime = at2359(p.dueDate);
      delete p.dueDate;
    }
  });

  fs.writeFileSync(path.join(dir, 'posts.json'), JSON.stringify(data, null, 2));
}

const summaryDir = path.join(base, 'Summary');
ensureDir(summaryDir);
fs.writeFileSync(path.join(summaryDir, '.gitkeep'), '');

console.log('Mock data created at', base);
