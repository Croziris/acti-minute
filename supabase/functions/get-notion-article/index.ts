import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionBlock {
  type: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notionToken = Deno.env.get('NOTION_TOKEN');
    const databaseId = Deno.env.get('NOTION_DATABASE_ID');

    if (!notionToken || !databaseId) {
      throw new Error('Missing Notion credentials');
    }

    console.log('Fetching article with slug:', slug);

    // Query la database pour trouver l'article par slug
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: 'Slug',
              rich_text: {
                equals: slug
              }
            },
            {
              property: 'Status',
              select: {
                equals: 'Publié'
              }
            }
          ]
        }
      }),
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('Notion API error:', errorText);
      throw new Error(`Notion API error: ${queryResponse.status}`);
    }

    const queryData = await queryResponse.json();

    if (queryData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const page = queryData.results[0];
    const props = page.properties;

    // Extraire les métadonnées
    const titre = props.Titre?.title?.[0]?.plain_text || '';
    const excerpt = props.Excerpt?.rich_text?.[0]?.plain_text || '';
    const author = props.Author?.rich_text?.[0]?.plain_text || '';
    const published_at = props.Published?.date?.start || null;
    const categories = props.Categories?.multi_select?.map((cat: any) => cat.name) || [];
    
    let cover_url = null;
    if (page.cover) {
      if (page.cover.type === 'external') {
        cover_url = page.cover.external?.url;
      } else if (page.cover.type === 'file') {
        cover_url = page.cover.file?.url;
      }
    }

    // Récupérer le contenu de la page (blocks)
    console.log('Fetching page content for:', page.id);
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!blocksResponse.ok) {
      const errorText = await blocksResponse.text();
      console.error('Notion blocks API error:', errorText);
      throw new Error(`Notion blocks API error: ${blocksResponse.status}`);
    }

    const blocksData = await blocksResponse.json();

    // Renvoyer les blocks structurés avec leur formatage complet
    const blocks = blocksData.results.map((block: NotionBlock) => {
      const blockData: any = {
        id: block.id,
        type: block.type,
      };

      // Extraire les rich_text avec formatage pour chaque type de block
      const blockType = block[block.type];
      if (blockType?.rich_text) {
        blockData.rich_text = blockType.rich_text.map((rt: any) => ({
          text: rt.plain_text || '',
          annotations: {
            bold: rt.annotations?.bold || false,
            italic: rt.annotations?.italic || false,
            strikethrough: rt.annotations?.strikethrough || false,
            underline: rt.annotations?.underline || false,
            code: rt.annotations?.code || false,
            color: rt.annotations?.color || 'default'
          },
          href: rt.href || null,
        }));
      }

      // Gérer les images
      if (block.type === 'image') {
        blockData.image = {
          url: block.image?.type === 'external' 
            ? block.image.external?.url 
            : block.image?.file?.url,
          caption: block.image?.caption?.map((c: any) => c.plain_text).join('') || '',
        };
      }

      return blockData;
    });

    const article = {
      id: page.id,
      titre,
      slug,
      excerpt,
      author,
      published_at,
      categories,
      cover_url,
      blocks,
    };

    return new Response(JSON.stringify(article), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Notion article:', error);
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
