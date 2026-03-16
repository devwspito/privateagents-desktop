export function SimpleMarkdownPreview({ content }: { content: string }) {
  const html = content
    .replace(
      /^### (.*)$/gm,
      '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
    )
    .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>'
    )
    .replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline">$1</a>'
    )
    .replace(
      /\{\{([^}]+)\}\}/g,
      '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded text-yellow-800 dark:text-yellow-200">{{$1}}</span>'
    )
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n(?!<)/g, "<br/>")

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p class="my-2">${html}</p>` }}
    />
  )
}
