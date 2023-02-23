export default {
    name: 'React Component',
    description: 'Used for creating a react component',
    variables: (name) => ({
        COMPONENT: name,
        TEST_ID: name.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase(),
    }),
    prompts: (_name) => ([
        // {
        //     name: 'SOME_VAL',
        //     message: 'Enter a value for SOME_VAL:',
        // }
    ]),
    macros: {
        repeatString: (str, n) => `${str} `.repeat(n).trimEnd()
    },
    afterFileCreated: (path, _dryRun, variables) => {
        console.log(`>>>>>>>>>>>> '${variables.NAME}' template created ${path}`);
    },
    stripLines: [
        '// TEMPLATE:', //template comments
        /\/\/.*\bSTRIP\b/,
    ],
    srcRoot: './src',
    destinations: './src/testdir',
    // destinations: ['src/testdir/dir1/subdir1'],
}
