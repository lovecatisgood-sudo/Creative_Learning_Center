# Blog Publishing API

This API is for trusted server-to-server publishing agents such as OpenClaw.
It does not use the browser admin session and must never be called directly
from public frontend JavaScript.

## Endpoints

| Language | Method | Endpoint |
|---|---|---|
| Thai | `POST` | `https://creative.siamesecat.cafe/api/integrations/blog/th/posts` |
| English | `POST` | `https://creative.siamesecat.cafe/api/integrations/blog/en/posts` |

Both endpoints accept the same payload. The endpoint determines which language
fields are written; there is no language field in the JSON body.

## Authentication Setup

Generate one random 64-character hexadecimal key:

```bash
openssl rand -hex 32
```

1. In Hostinger hPanel, open the Node.js application's environment variables.
2. Add `BLOG_PUBLISH_API_KEY` with the generated value.
3. Restart or redeploy the application.
4. Add the same value to OpenClaw's secret environment as
   `BLOG_PUBLISH_API_KEY`.
5. Never place the key in a prompt, source file, Git commit, URL query string,
   screenshot, or normal application log.

Every request must send:

```http
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: application/json
```

## Valid Categories

The `category` value must be one of these exact lowercase IDs:

| API value | English label | Thai label |
|---|---|---|
| `parenting-guides` | Parenting Guides | คู่มือสำหรับผู้ปกครอง |
| `kid-learning-material` | Kid Learning Material | สื่อการเรียนรู้สำหรับเด็ก |
| `club-news-updates` | Club News & Updates | ข่าวสารและอัปเดตจากคลับ |
| `faq` | FAQ | คำถามที่พบบ่อย |

Do not send the display label as the category value.

## Request Body

```json
{
  "slug": "helping-children-build-a-reading-routine",
  "category": "parenting-guides",
  "title": "Required title in the endpoint language",
  "summary": "Required card and article introduction, maximum 420 characters.",
  "bodyMarkdown": "## First heading\n\nRequired article body in Markdown.",
  "status": "published",
  "seoTitle": "Optional search title",
  "seoDescription": "Optional search description",
  "coverImageUrl": "https://example.com/image.webp",
  "coverImageAlt": "Optional image description in the endpoint language"
}
```

### Required Fields

- `slug`: Stable ASCII URL name containing letters, numbers, and hyphens. Use
  the same slug for the Thai and English versions of one article.
- `category`: One exact category ID from the table above.
- `title`: Title written only in the endpoint language. Maximum 160 characters.
- `summary`: Short customer-facing introduction. Maximum 420 characters.
- `bodyMarkdown`: Full article in Markdown. Maximum 100,000 characters.
- `status`: Must be exactly `draft` or `published`.

### Optional Fields

- `seoTitle`: Search title. Maximum 120 characters. The article title is used
  when omitted.
- `seoDescription`: Search description. Maximum 320 characters. The summary is
  used when omitted.
- `coverImageUrl`: HTTPS image URL or a site-relative path beginning with `/`.
  This cover URL is shared by both languages.
- `coverImageAlt`: Cover description written in the endpoint language. Maximum
  240 characters.

Markdown may contain headings, paragraphs, lists, links, images, blockquotes,
tables, and code blocks. Raw HTML is displayed as text, and unsafe URL schemes
such as `javascript:` are removed.

## Thai Publishing Example

```bash
curl --fail-with-body \
  --request POST \
  'https://creative.siamesecat.cafe/api/integrations/blog/th/posts' \
  --header "Authorization: Bearer $BLOG_PUBLISH_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "slug": "helping-children-build-a-reading-routine",
    "category": "parenting-guides",
    "title": "ช่วยลูกสร้างนิสัยรักการอ่านอย่างเป็นธรรมชาติ",
    "summary": "แนวทางง่าย ๆ สำหรับผู้ปกครองในการทำให้การอ่านเป็นส่วนหนึ่งของกิจวัตรประจำวัน",
    "bodyMarkdown": "## เริ่มจากช่วงเวลาสั้น ๆ\n\nเลือกเวลาอ่านหนังสือที่เด็กสบายใจและเริ่มเพียงวันละ 10 นาที\n\n## ให้เด็กได้เลือก\n\nเปิดโอกาสให้เด็กเลือกหนังสือที่สนใจด้วยตัวเอง",
    "status": "published",
    "seoTitle": "วิธีช่วยลูกสร้างนิสัยรักการอ่าน",
    "seoDescription": "คำแนะนำสำหรับผู้ปกครองในการสร้างกิจวัตรการอ่านที่สนุกและเหมาะกับเด็ก"
  }'
```

## English Publishing Example

Use the same slug and category to attach the English translation to the Thai
post rather than creating a separate article record.

```bash
curl --fail-with-body \
  --request POST \
  'https://creative.siamesecat.cafe/api/integrations/blog/en/posts' \
  --header "Authorization: Bearer $BLOG_PUBLISH_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "slug": "helping-children-build-a-reading-routine",
    "category": "parenting-guides",
    "title": "Helping Children Build a Natural Reading Routine",
    "summary": "Simple ways for parents to make reading a comfortable part of everyday family life.",
    "bodyMarkdown": "## Start with a short session\n\nChoose a calm time and begin with ten minutes of reading each day.\n\n## Let children choose\n\nGive children a chance to select books that genuinely interest them.",
    "status": "published",
    "seoTitle": "How to Help Children Build a Reading Habit",
    "seoDescription": "Practical ideas for creating an enjoyable and age-appropriate reading routine at home."
  }'
```

The resulting customer URLs are:

- Thai: `https://creative.siamesecat.cafe/blog/helping-children-build-a-reading-routine`
- English: `https://creative.siamesecat.cafe/EN/blog/helping-children-build-a-reading-routine`

## JavaScript / OpenClaw Example

```js
const API_BASE = "https://creative.siamesecat.cafe/api/integrations/blog";

async function publishBlogPost(language, post) {
  if (!['th', 'en'].includes(language)) throw new Error('language must be th or en');

  const response = await fetch(`${API_BASE}/${language}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.BLOG_PUBLISH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Blog API ${response.status}: ${result.error}`);
  }
  return result;
}

await publishBlogPost('en', {
  slug: 'creative-play-with-recycled-paper',
  category: 'kid-learning-material',
  title: 'Creative Play with Recycled Paper',
  summary: 'Three simple paper activities children can try at home.',
  bodyMarkdown: '## Paper collage\n\nCollect clean paper and cut it into simple shapes.',
  status: 'published',
});
```

## Upsert and Retry Rules

- `POST` is an upsert. A new slug returns `201 Created`; an existing slug
  returns `200 OK` and updates only the endpoint language.
- Retrying a timed-out request with the same slug is safe and does not create a
  duplicate post.
- Thai and English calls using the same slug preserve each other's content.
- The category belongs to the shared article. A second-language call with a
  different category returns `409 Conflict` rather than silently changing it.
- Sending `status: "draft"` stores that language but returns no public URL and
  keeps it out of the public blog and sitemap.
- Sending the same content later with `status: "published"` publishes it.
- Sending `status: "draft"` for an already published language unpublishes only
  that language. The other language is unaffected.
- Omitted optional fields remain unchanged when updating an existing post.
- A supplied empty optional string clears that field.

## Successful Response

New post (`201`) or updated post (`200`):

```json
{
  "ok": true,
  "action": "created",
  "language": "en",
  "status": "published",
  "post": {
    "id": 42,
    "slug": "creative-play-with-recycled-paper",
    "category": "kid-learning-material",
    "publicUrl": "https://creative.siamesecat.cafe/EN/blog/creative-play-with-recycled-paper",
    "adminUrl": "https://creative.siamesecat.cafe/admin/blog/42",
    "publishedAt": "2026-07-17T12:00:00.000Z",
    "updatedAt": "2026-07-17T12:00:00.000Z"
  }
}
```

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Invalid JSON or body shape |
| `401` | Missing or incorrect bearer key |
| `409` | Existing slug uses a different category |
| `413` | Request is too large |
| `415` | Content type is not JSON |
| `422` | Missing field, invalid category/status, or field too long |
| `503` | `BLOG_PUBLISH_API_KEY` is not configured on the server |

For cron automation, treat `200` and `201` as success. Retry temporary network
errors and `500` responses with the same slug using exponential backoff. Do not
retry `400`, `401`, `409`, `413`, `415`, or `422` until the request is corrected.

## OpenClaw Publishing Rules

Give the agent these rules together with the endpoint and secret environment
variable name:

1. Select exactly one allowed category ID; never invent a category.
2. Generate a descriptive lowercase ASCII slug with hyphens.
3. Use the same slug and category for paired Thai and English versions.
4. Send Thai text only to `/th/posts` and English text only to `/en/posts`.
5. Never include a language field in the request body.
6. Use Markdown, not raw HTML, for the article body.
7. Use `draft` when human review is required and `published` only when the post
   is ready for customers and Google indexing.
8. Verify that the response language, slug, category, status, and public URL
   match the intended post before recording the cron run as successful.
9. Reuse the same slug when retrying a failed or timed-out request.
10. Never print or store the bearer key in task output or logs.
