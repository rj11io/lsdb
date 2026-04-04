module.exports = {
  branches: ["main"],
  repositoryUrl: "https://github.com/rj11io/lsdb.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
        tarballDir: "dist",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        failComment: false,
        assets: [
          { path: "dist/*.tgz", label: "npm package tarball" },
          { path: "CHANGELOG.md", label: "Changelog" },
        ],
      },
    ],
  ],
};
