import { forbidden } from 'next/navigation';

export default function TestForbiddenPage() {
  forbidden(); 
  
  return (
    <div>
      This text will never show because forbidden() halts rendering lol.
    </div>
  );
}