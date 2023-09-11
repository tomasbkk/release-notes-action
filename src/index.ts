import * as actions from '@actions/core';
import * as github from '@actions/github';

async function run() {
	try {
		actions.info('Fetching release notes...');

		const token = actions.getInput('token', { required: true });
		//const tagName = actions.getInput('tag-name', { required: true });
		//const prevTagName = actions.getInput('prev-tag-name', { required: false });
		const branch = actions.getInput('branch', { required: false }) || 'main';
		if (!token) throw new Error('Input "token" is required');
		//if (!tagName) throw new Error('Input "tag-name" is required');
		if (!branch) throw new Error('Input "branch" is required');


        // Use 'git' command to get the last two tag names
        const tagNames = execSync('git for-each-ref --count=2 --sort=-creatordate --format "%(refname:short)" refs/tags')
            .toString()
            .trim()
            .split('\n');

        if (tagNames.length < 2) {
            throw new Error('Not enough tags found to generate release notes');
        }

        const tagName = tagNames[0]; // Last tag name
        const prevTagName = tagNames[1]; // Second-to-last tag name

		const octokit = github.getOctokit(token);

		const { owner, repo } = github.context.repo;

		const releaseNotes = await octokit.request(
			'POST /repos/{owner}/{repo}/releases/generate-notes',
			{
				owner,
				repo,
				tag_name: tagName,
				target_commitish: branch,
				previous_tag_name: prevTagName,
			},
		);

		const notes = releaseNotes.data.body;

		actions.info('Release notes fetched');

		actions.debug(`Release notes: ${notes}`);

		actions.info('Finished!');

		actions.setOutput('release-notes', notes);
	} catch (error) {
		actions.setFailed(error.message);
	}
}

run();
