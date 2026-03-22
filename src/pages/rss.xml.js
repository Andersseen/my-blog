import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	let blogPosts = [];
	try { blogPosts = await getCollection('blog'); } catch { /* empty */ }

	let mediumPosts = [];
	try { mediumPosts = await getCollection('medium'); } catch { /* empty */ }

	const allPosts = [...blogPosts, ...mediumPosts]
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: allPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: post.data.isExternal ? post.data.link : `/blog/${post.id}/`,
		})),
	});
}
