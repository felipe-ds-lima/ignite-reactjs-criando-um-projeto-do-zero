/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Fragment, useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  const readingTime = useMemo(() => {
    const phrases = post.data.content
      .map(item => item.body.map(body => body.text).join(' '))
      .join(' ');
    const words = phrases.split(' ').length;

    const minutes = Math.ceil(words / 200);

    return `${minutes} min`;
  }, [post]);

  const dateFormatted = useMemo(() => {
    return format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }, [post.first_publication_date]);

  if (isFallback) {
    return <p>Carregando...</p>;
  }
  return (
    <main>
      <img className={styles.banner} src={post.data.banner.url} alt="Banner" />
      <div className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <span>
              <FiCalendar />
              {dateFormatted}
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {readingTime}
            </span>
          </div>

          {post.data.content.map(content => (
            <Fragment key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 4,
      orderings: '[document.first_publication_date]',
    }
  );

  const paths = postsResponse.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', params.slug?.toString(), {});

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
