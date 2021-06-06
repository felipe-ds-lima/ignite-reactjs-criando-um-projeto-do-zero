import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState<null | string>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setNextPage(postsPagination.next_page);
    setPosts(
      postsPagination.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            parseISO(post.first_publication_date),
            'dd MMM yyyy',
            { locale: ptBR }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      })
    );
  }, [postsPagination]);

  function handleCallNextPage() {
    fetch(nextPage)
      .then(response => response.json())
      .then(response => {
        setNextPage(response.next_page);
        setPosts([
          ...posts,
          ...response.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: format(
                parseISO(post.first_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              ),
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
              },
            };
          }),
        ]);
      });
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.postList}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h2>{post.data.title}</h2>
              <strong>{post.data.subtitle}</strong>
              <div>
                <span>
                  <FiCalendar /> {post.first_publication_date}
                </span>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>
      {nextPage && (
        <button
          className={styles.loadPostsButton}
          type="button"
          onClick={handleCallNextPage}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 4,
      page: 1,
      orderings: '[document.first_publication_date]',
    }
  );

  const { results } = postsResponse;

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
