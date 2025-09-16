import { Metadata } from 'next';
import NewCandidate from '@/components/interviews/meeting/NewCandidate';

interface Props {
  params: {
    workflow_id: string;
    interview_id: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { interview_id, workflow_id } = params;

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const fallbackTitle = 'FigLinks Interview';
  const fallbackDescription = 'AI Interviews with Human Insights';
  const fallbackImage = `${apiBase}/interviews/fig-links-logo.svg`;

  try {
    const response = await fetch(
      `${apiBase}/workflows/${workflow_id}/get-meta-data?_t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch metadata');

    const result = await response.json();
    const data = result?.data;

    const companyName = data?.company?.name || 'FigLinks';
    const title = data?.title || fallbackTitle;
    const description = data?.description || fallbackDescription;

    const logoUrl = data?.company?.logo?.startsWith('http')
      ? data.company.logo
      : fallbackImage;

    const pageUrl = `${baseUrl}/workflows/${workflow_id}/join-interview/${interview_id}`;
    const fullDescription = `${companyName} - ${description}`;

    return {
      title,
      description: fullDescription,
      openGraph: {
        title,
        description: fullDescription,
        url: pageUrl,
        siteName: 'FigLinks',
        type: 'website',
        images: [
          {
            url: logoUrl,
            width: 1200,
            height: 630,
            alt: `${title} at ${companyName}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: fullDescription,
        images: [logoUrl],
      },
    };
  } catch (error) {
    console.error('Metadata generation error:', error);

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        siteName: 'FigLinks',
        type: 'website',
        images: [
          {
            url: fallbackImage,
            width: 1200,
            height: 630,
            alt: 'FigLinks Logo',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: [fallbackImage],
      },
    };
  }
}

export default function NewCandidatePage() {
  return <NewCandidate />;
}