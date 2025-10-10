import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionProperty {
  id: string;
  type: string;
  [key: string]: any;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  cover?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notionToken = Deno.env.get('NOTION_TOKEN');
    const databaseId = Deno.env.get('NOTION_DATABASE_ID');

    if (!notionToken || !databaseId) {
      throw new Error('Missing Notion credentials');
    }

    console.log('Fetching articles from Notion database:', databaseId);

    // Query la database Notion avec filtre pour articles publiés
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'Status',
          select: {
            equals: 'Publié'
          }
        },
        sorts: [
          {
            property: 'Published',
            direction: 'descending'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', errorText);
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.results.length} published articles`);

    // Formater les articles pour correspondre au format attendu
    const articles = data.results.map((page: NotionPage) => {
      const props = page.properties;
      
      // Extraire les valeurs des propriétés Notion
      const titre = props.Titre?.title?.[0]?.plain_text || '';
      const slug = props.Slug?.rich_text?.[0]?.plain_text || '';
      const excerpt = props.Excerpt?.rich_text?.[0]?.plain_text || '';
      const author = props.Author?.rich_text?.[0]?.plain_text || '';
      const published_at = props.Published?.date?.start || null;
      const categories = props.Categories?.multi_select?.map((cat: any) => cat.name) || [];
      
      // Extraire l'URL de couverture
      let cover_url = null;
      if (page.cover) {
        if (page.cover.type === 'external') {
          cover_url = page.cover.external?.url;
        } else if (page.cover.type === 'file') {
          cover_url = page.cover.file?.url;
        }
      }

      return {
        id: page.id,
        titre,
        slug,
        excerpt,
        author,
        published_at,
        categories,
        cover_url,
      };
    });

    return new Response(JSON.stringify(articles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Notion articles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
