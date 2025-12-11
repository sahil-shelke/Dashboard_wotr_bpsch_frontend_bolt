export const formatAnswer = (answer: string) => {
  if (typeof answer !== 'string') {
    console.error('Expected a string but received:', answer);
    return '';
  }
  answer = answer.replace(/\\([_*[\]<>])/g, '\\$1');

  answer = answer.replace(/<html>|<\/html>|<body>|<\/body>/g, '');

  answer = answer.replace(/&nbsp;/g, ' ');
  answer = answer.replace(/\\n\\n/g, '');
  answer = answer.replace(/\\n/g, '');

  answer = answer.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  answer = answer.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  answer = answer.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  answer = answer.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  answer = answer.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
  answer = answer.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
  answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  answer = answer.replace(/\[(.*?)\]/g, '<strong>$1</strong>');
  answer = answer.replace(/\*(.*?)\*/g, '<em>$1</em>');

  answer = answer.replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4">$2</li>');
  answer = answer.replace(/^[*-] (.*)$/gm, '<li class="ml-4">$1</li>');

  answer = answer.replace(/<ul><\/ul>/g, '');
  answer = answer.replace(/<li><\/li>/g, '');
  answer = answer.replace(/<p><\/p>/g, '');
  answer = answer.replace(/<br\/><hr\/><br\/>/g, '<br/><hr/>');
  answer = answer.replace(/\\([<>&])/g, '$1');

  return answer;
};
