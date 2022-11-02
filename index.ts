import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

function migrateTranslationTag(content:string): string {
    // Find all translation tags using regex
    const regex = /(?<TagOpener>{%[. ]trans[. ]')(?<={%[. ]trans[. ]')(?<String>.*)(?=.*'.*%})(?<TagCloser>.*'[. ]%})/g;
    const matches = content.match(regex);
    
    if (matches) {
        matches.forEach((match) => {
            // Replace the old syntax with the new syntax.
            // Group "TagOpener" is the opening tag, group "String" is the string to be translated, group "TagCloser" is the closing tag.
            content = content.replace(match, match.replace(regex, '{{ $<String> | trans }}'));
        });
    }

    return content;
}

(async () => {
    const inputDir = path.resolve('input');
    const outputDir = path.resolve('output');

    // Copy the input directory to the output directory
    fs.copy(inputDir, outputDir, function (err) {
        if (err) {
            console.log('An error occured while copying the folder.')
            return console.error(err)
        }
    
        glob('output/**/*.+(phtml|twig)',  async function (err, files) {
            if (err) {
                console.log('An error occured while reading the files.')
                return console.error(chalk.bgRed(`ERR!`) + " " + err)
            }
            
            // Exit the program if the input directory does not exist or is empty
            if (!files.length) {
                console.error('Template files are missing. Make sure you have placed your template files in the "input" directory.');
                process.exit(1);
            }
    
            // Process each file
            for (const file of files) {
                console.log(chalk.bgYellow(`Processing`) + " " + file.split("/").pop());
                const outputFile = path.join(outputDir, path.relative('input', file));
    
                var content = await fs.readFile(file, 'utf8');
                content = migrateTranslationTag(content);
    
                await fs.outputFile(outputFile, content);
            }

            console.log(chalk.bgGreen(`OK!`) + " " + "All files have been processed.");
            console.log("You can now find the migrated files in the 'output' directory.\n----------\nDid this script help you? Please consider donating to our organization:\nhttps://fossbilling.org/donate");
        });
    });
})();