# Introduction 
Scaffolding templates for your project. 
Make sure your team is using the same patterns by using scaffolding templates.
Quickly create multiple files based on simple templates.
Access to environment variables, users prompts, and scripting.

# Getting Started
1. `npm install template-scaffolder`
2. Create a `scaffolding` directory in the root of your project.
3. Create a sub-folder in the in your _scaffolding_ folder for your (first) template.
4. In the template folder add a `scaffolding.config.mjs` file with
   a simple default configuration of `export default {}` as the contents.
5. Add 1 or more files to the _template_ folder.
6. (optional) Add a script to your `package.json` file to run the scaffolder:
    `"scaffold": "npx scaffolder" `
7. Fine tune your configuration, templates, and npm scripts by reading below.

# Table of Contents
* [Configuration files](#configuration-files)
* [Command Line Options](#command-line)
* [Creating a Template](#making-a-template)
* [Sample Project](#sample-project)

# Configuration Files
Each template must have exactly one `scaffolding.config.mjs` file
in the root.
It is a javascript esm module file. 
The typescript schema for this file is:
```typescript
export interface IConfigFile
{
    name?: string;
    description?: string;
    version?: string;
    variables?: object | ((instanceName: string) => any),
    prompts?: DistinctQuestion[] | ((instanceName: string) => DistinctQuestion[]);
    c?: Array<string|RegExp>;
    macros?: object;
    destinations?: Array<string>|string;
    createNameDir?: boolean;
    srcRoot?: string;
    afterFileCreated?: (createdFilePath: string, dryRun: boolean, variablesHash: TemplateVariables) => Promise<string[]>;
}
```

**Note:** reference to _'instance name'_ is referring to the _name_ that the user
enters when running the scaffolder. This is not the same as the name of the template.

The defaults will work for most people, so you can have a template
with the following default config: `scaffolding.config.mjs`;
```javascript
export default {
}
```

Because this is a regular javascript file, you have access to
`process.env`, and any other javascript functions.

## Configuration options
All fields are optional.

### `variables` _(optional)_
A hash of keys (variable names) and values that you  would like to
use in your template files.

Simple example:
```javascript
export default {
    variables: {
       CREATED_BY: process.env.USERNAME,
       CREATED_ON: new Date().toString(),
    }
}
```
This can also be a function that returns the object giving
access to the instance name which the user has supplied.
```javascript
export default {
    variables: (instanceName) => ({
       COMPONENT_NAME: instanceName,
       TEST_ID: instanceName.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase(),
    })
}
```

#### Built in Variables
The following variables are available without defining them.
All built in variables except NAME can be overwritten using the _variables_ section.
- NAME - the values for _name_ as entered on command line or through prompts.
- TEMPLATE_NAME - the name of the template as it appears in the `name` fields of the config file.
- TEMPLATE_VERSION - the version of the template of the as it appears in the `version` fields of the config file.
- USERNAME - name of the user running the scaffolder according to the `USERNAME` environment variable.

### `destinations` _(optional)_
The root folder where generated files will be created.

If no value is supplied, the user will be prompted to select a directory under
`srcRoot`.

The value can be a list of strings, or a single string:

If a list of paths/string is supplied, the user will be prompted to select
one of the options. They will
be allowed to select **Other**, and enter their own directory.

If a single string is supplied, this value will be used for the destination,
and the user will not be prompted for a value.

### `createNameDir`  _(defaults to `true`)_
By default, the scaffolder will create a directory at the root of the
destination folder named by the value you enter for the `NAME` variable.
The template files will be placed in this created directory.
If you do not want this to happen, set this value to `false`.

### `srcRoot` _(defaults to `./src` or `process.cwd()`)
When the user is being prompted to enter a destination directory,
only directories under the **srcRoot** directory will be available.
By default, the `src` directory in the root of your project will be used 
if one exists. If you do not have a `src` directory, then the current
working directory will be used.

Use this value if you need something other than the defaults.

### `stripLines`
Use for removing lines from the template before processing.
A list of strings or regex patterns used to test each line.
Lines that match any pattern will be removed before processing variables and macros.
If a pattern is a string, the test will determine if the line starts with that string (ignoring whitespace).
For regex patterns, `test()` will be called on the line to determine a match.

### `afterFileCreated` _(optional)_
If you need some special processing after a file has been scaffolded, you can
use this *async* function.
It will execute after each file is created.

You can optionally return a list of 1 or more commands to run as well.

An example would be adding the created file to _git_,
running a formatter on the file,
or adding the new file to your IDE's project file, etc.

In the case of a _dry run_, the file will not actually be created,
so you may want to guard against this in your function if it expects it to exist.

The commands that run will not be interactive and should not
expect user input.

```javascript
export default {
    afterFileCreated: async (path, dryRun, variables) => {
        console.log(`${variables.NAME} adding ${path} to git`);
        if(dryRun) return null;
        return [`git add ${path}`, `npx prettier --write ${path}`];
    }
}
```

You can return null if all the processing you require occurs in your function.


### `prompts` _(optional)_
If your template requires variable values to be entered by the user,
you may prompt the user. The prompts field is an array of 
`DistinctQuestion` objects, or a function that returns an array of 
`DistinctQuestion` objects, as defined by the Inquirer user prompter. 
The function form is handy if you need access to the instance name.

You can read more about what a `DistincQuestion` is by looking at the
(3rd party) **inquirer** documentation [here](https://github.com/SBoudrias/Inquirer.js#questions).

Answers to prompts will be placed available in templates as variables
where the `name` property will be the variable name,
and the user response will be the value.

For a simple question, you will just need two values: 
```javascript
export default {
    prompts: [
       {
          name: 'MYVAR',
          message: 'Enter a value for My Var:'
       }
    ]
}
```
The above will provide the `MYVAR` replacement in your templates now.

You can offer multiple choice like this:
```javascript
export default {
   prompts: [
      {
         name: 'OPTION',
         message: 'Select an option:',
         type: 'list',
         choices: [ 'option 1', 'option 2' ],
      }
   ]
}
```
There are a lot of advanced questions types, including conditional questions 
that are supported. To see the complete documentation on what type of
question prompts are supported, visit
[Inquirer documentation](https://github.com/SBoudrias/Inquirer.js#questions).
Note that the only plugin supported is **inquirer-fuzzy-path**.

### `macros` _(optional)_
An object containing 1 or more functions that return a string.
These functions can be called as macros from your templates.
They can take arguments as well.
Config:
```javascript
export default {
    macros: {
       repeat: (str) => `${str}-${str}`,
       truncate: (str, len) => ((str||'').substring(0,len))
    }
}
```

In an HTML file template:
```html
<p>
    This is a paragraph.
    #repeat('this is a paragraph that is long', 11)
    Name 2x: #repeat(${NAME})
</p>
```
If template is using with a value for NAME of 'TheName', the result would be:
```html
<p>
    This is a paragraph.
    this is a p
    Name 2x: TheName-TheName
</p>
```

**Note:** macros do not work when transforming file paths.

# Command Line
The structure of running the **scaffolder** is as follows:
```bash
scaffolder [destinationDirectory] [--template=<templateName>] [--name=<NAME>] [--dryRun]
```
## Arguments
All arguments to the command line are optional.
If you do not supply the arguments on the command line,
you will be prompted for their values.

### Destination Directory
Directory which is the root of where generated files will be placed.
If you specify this value on the command line, _it must be the first argument_.
If it is not specified, the user will be prompted input a value.

### template
Name of the template to use for generating files. This will be the name of a
sub-folder in the **scaffolding** directory.
If it is not specified, the user will be prompted input a value.

### name
Value for the instance NAME variable.
If it is not specified, the user will be prompted input a value.

### dryRun
If this flag is specified, no files or directories will be created.
The contents of what would have been written will be dumped to the console.

# Making a Template

1. Create a folder in the **scaffolding** directory.
2. Create a `scaffolding.config.mjs` file, and configure it as above.
3. Add files and directories that you will want generated 
   when executing the template.

## Parts of the Template

### Directories
The _scaffolder_ will generate directories to match what is in the template dir.
The name of the directories can contain variable names that will be substituted.

**e.g.,** 
* a template file with the path `component/${SUB_COMPONENT}/index.tsx`
* Enter 'MySubComponent' when prompted for SUB_COMPONENT
* Enter 'MyComponent' when prompted for NAME
* Generated file will have path: `MyComponent/MySubComponent/index.tsx`

### Template Files
File names may contain variable names that will be substituted.

**e.g.,**
* a template file with the path `component/${NAME}.tsx`
* Enter 'MyComponent' when prompted for NAME
* Generated file will have path: `src/MyComponent/MyComponent.tsx`

### File Contents
Files can be of any type, and have any content.
Variable substitution, and calling macros is all done via the 
[Apache 'Velocity Template Language'](https://velocity.apache.org/)
(VTL) syntax. 

#### VTL Tips
* In for a simple variable replacement use `${NAME}`.
* Use backslash `\ ` to escape the transformation: 
  `\${NAME}` will not get transformed.
* [Conditionals](https://velocity.apache.org/engine/1.7/user-guide.html#if-elseif-else) 
  such as `if/else` can be handy.
* Macros are called as `#myMacro()`.
* VTL is very powerful. To fully take advantage of it, the 
[Velocity Template User Guide](https://velocity.apache.org/engine/1.7/user-guide.html).

# Sample Project
The following is a directory structure for a React project.
It supplies two templates: **component** and **page**.

```text
- projectRoot
  - scaffolding
    - component
      - __tests__
        - ${NAME}.test.tsx
      ${NAME}.tsx
      styles.ts
      scaffolding.config.mjs
    - page
      ${NAME}.tsx
      scaffolding.config.mjs
  - src
    - common
      - components 
    - pages
```

Let's look at the _component_ template.

## scaffolding/component/scaffolding.config.mjs
```javascript
export default {
    name: 'React Component',
    description: 'for common components',
    variables: (name) => ({
        TEST_ID: name.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase(),
    }),
   destinations: [ 'src/components' ], //suggest most common name first
   srcRoot: './src', //default value,
   afterFileCreated: (path, variables) => {
        console.log(`adding ${path} to git`);
        return [ `git add ${path}` ];
   },
}
```

## scaffolding/component/${NAME}.tsx
```tsx
import * as React from 'react';
import {ReactElement} from 'react';
import {use${NAME}Styles} from './styles';

interface I${NAME}Props
{
}

export const ${NAME} = ({}: I${NAME}Props): ReactElement => {

    use${NAME}Styles();

    const someVar = 'Need to escape this';
    
    return (
        <div data-testid="${TEST_ID}">
            {`The name variable is \${someVar}`}
        </div>
    );
};
```

## scaffolding/component/__tests__/${NAME}.test.tsx
```tsx
import * as React from 'react';
import {render} from '@testing-library/react';
import '@testing-library/jest-dom';
import {${NAME}} from '../${NAME}';

describe('<${NAME} />', () => {
    it('should render without blowing up', () => {
        const result = render(<${NAME} />);
        expect(result.getByTestId('${TEST_ID}')).toBeInTheDocument();
    });
});
```

## scaffolding/component/styles.ts
```typescript
import {createUseStyles} from 'react-jss';
import {ITheme} from '@models';

export const use${NAME}Styles = (createUseStyles((theme: ITheme) => {
    return ({});
}));
```

## scaffolding/page/scaffolding.config.mjs
```javascript
export default {
    prompts: () => ([
        {
            name: 'TITLE',
            message: 'Enter page heading'
        }
    ]),
    macros: {
        truncate: (str, n) => ((str || '').substring(0, n))
    },
}
```

## scaffolding/page/${NAME}.tsx
```tsx
import * as React from 'react';
import {ReactElement} from 'react';

export const ${NAME} = (): ReactElement => {

    return (
        <div>
            <h1>
                Title: #truncate(${TITLE}, 40)
            </h1>
            <p>
                This is page content.
            </p>
        </div>
    );
};
```


